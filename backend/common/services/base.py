from typing import Type, TypeVar, Generic, Any, Optional
from django.db import transaction
from ..repositories.base import BaseRepository

T = TypeVar("T")


class BaseService(Generic[T]):
    """
    Standardizes business logic orchestration.
    Services should NOT touch the ORM directly; they must use a Repository.
    """

    repository_class: Type[BaseRepository] = None

    def __init__(self, repository: Optional[BaseRepository] = None):
        """
        Allows dependency injection for the repository.
        If no repository is provided, it instantiates the default repository_class.
        """
        self.repository = repository or self.repository_class()
        if self.repository is None:
            raise ValueError("The 'repository_class' must be defined in subclasses or a repository instance must be passed.")

    def get_by_id(self, pk: Any) -> Optional[T]:
        """Fetch a record by ID via the repository."""
        return self.repository.get_by_id(pk)

    def get_all(self):
        """Fetch all records via the repository."""
        return self.repository.all()

    def get_filtered(self, **kwargs):
        """Fetch filtered records via the repository."""
        return self.repository.filter(**kwargs)

    @transaction.atomic
    def create(self, **data) -> T:
        """
        Orchestrates the creation of a new record.
        Wraps in a transaction to ensure data integrity.
        """
        # Logic for pre-creation checks or auditing can be added here
        return self.repository.create(**data)

    @transaction.atomic
    def update(self, pk: Any, **data) -> Optional[T]:
        """
        Orchestrates the update of an existing record.
        """
        # Logic for pre-update checks or auditing can be added here
        return self.repository.update(pk=pk, **data)

    @transaction.atomic
    def delete(self, pk: Any, soft_delete: bool = True) -> bool:
        """
        Orchestrates the deletion of a record.
        """
        # Logic for pre-deletion checks or auditing can be added here
        return self.repository.delete(pk=pk, soft_delete=soft_delete)
