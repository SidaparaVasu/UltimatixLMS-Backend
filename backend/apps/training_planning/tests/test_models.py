from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
import datetime
from apps.org_management.models import CompanyMaster, BusinessUnitMaster, DepartmentMaster, JobRoleMaster, EmployeeMaster, LocationMaster
from apps.training_planning.models import TrainingPlan, TrainingSession, TrainingCalendar


class TrainingModelTest(TestCase):
    def setUp(self):
        # Base setup
        self.company = CompanyMaster.objects.create(company_name="Test Co", company_code="TCO")
        self.bu = BusinessUnitMaster.objects.create(company=self.company, business_unit_name="Tech")
        self.dept = DepartmentMaster.objects.create(business_unit=self.bu, department_name="Backend")
        self.loc = LocationMaster.objects.create(company=self.company, location_name="HQ")
        self.role = JobRoleMaster.objects.create(job_role_name="Dev", job_role_code="DEV")
        
        self.employee = EmployeeMaster.objects.create(
            employee_code="E001",
            company=self.company,
            business_unit=self.bu,
            department=self.dept,
            job_role=self.role,
            location=self.loc
        )

    def test_training_plan_year_validation(self):
        """Verify that year is within 2000-2100 range."""
        plan = TrainingPlan(
            plan_name="Invalid Year Plan",
            year=1999,
            department=self.dept,
            created_by=self.employee
        )
        with self.assertRaises(ValidationError):
            plan.full_clean()

    def test_training_calendar_uniqueness(self):
        """Verify that only one calendar per year per department is allowed."""
        TrainingCalendar.objects.create(
            year=2026,
            department=self.dept,
            created_by=self.employee
        )
        
        duplicate = TrainingCalendar(
            year=2026,
            department=self.dept,
            created_by=self.employee
        )
        with self.assertRaises(ValidationError):
            duplicate.full_clean()
