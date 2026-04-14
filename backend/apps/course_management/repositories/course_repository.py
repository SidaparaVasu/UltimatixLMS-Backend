from common.repositories.base import BaseRepository
from ..models import (
    CourseCategoryMaster,
    CourseMaster,
    TagMaster,
    CourseTagMap,
    CourseSkillMapping,
    CourseSection,
    CourseLesson,
    CourseContent,
    CourseResource,
    CourseDiscussionThread,
    CourseDiscussionReply
)
from django.db.models import Count


class CourseCategoryRepository(BaseRepository[CourseCategoryMaster]):
    model = CourseCategoryMaster

    def get_list_with_counts(self):
        """Fetches all categories annotated with the count of linked courses."""
        return self.model.objects.annotate(course_count=Count('courses'))


class CourseRepository(BaseRepository[CourseMaster]):
    model = CourseMaster

    def get_full_course_structure(self, course_id):
        """
        Retrieves a course with its complete hierarchy (Sections > Lessons > Content).
        Use select_related/prefetch_related to optimize performance.
        """
        return self.model.objects.filter(id=course_id).prefetch_related(
            "sections", 
            "sections__lessons", 
            "sections__lessons__contents",
            "tags__tag",
            "skilled_outcomes__skill"
        ).first()


class TagRepository(BaseRepository[TagMaster]):
    model = TagMaster


class CourseTagMapRepository(BaseRepository[CourseTagMap]):
    model = CourseTagMap


class CourseSkillMappingRepository(BaseRepository[CourseSkillMapping]):
    model = CourseSkillMapping


class CourseSectionRepository(BaseRepository[CourseSection]):
    model = CourseSection


class CourseLessonRepository(BaseRepository[CourseLesson]):
    model = CourseLesson


class CourseContentRepository(BaseRepository[CourseContent]):
    model = CourseContent


class CourseResourceRepository(BaseRepository[CourseResource]):
    model = CourseResource


class CourseDiscussionThreadRepository(BaseRepository[CourseDiscussionThread]):
    model = CourseDiscussionThread


class CourseDiscussionReplyRepository(BaseRepository[CourseDiscussionReply]):
    model = CourseDiscussionReply
