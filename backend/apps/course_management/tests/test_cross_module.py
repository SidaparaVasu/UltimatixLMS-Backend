from django.test import TestCase
from apps.course_management.models import CourseCategoryMaster, CourseMaster
from apps.training_planning.models import TrainingCalendar, TrainingSession
from apps.tni_management.models import ComplianceTrainingRequirement
from apps.org_management.models import CompanyMaster, BusinessUnitMaster, DepartmentMaster, LocationMaster, JobRoleMaster, EmployeeMaster


class CourseCrossModuleTest(TestCase):
    def setUp(self):
        # Base setup
        self.company = CompanyMaster.objects.create(company_name="Test Corp", company_code="TC")
        self.bu = BusinessUnitMaster.objects.create(company=self.company, business_unit_name="Tech")
        self.dept = DepartmentMaster.objects.create(business_unit=self.bu, department_name="Backend")
        self.loc = LocationMaster.objects.create(company=self.company, location_name="UK")
        self.role = JobRoleMaster.objects.create(job_role_name="Dev", job_role_code="DV")
        self.employee = EmployeeMaster.objects.create(
            employee_code="E001", company=self.company, business_unit=self.bu,
            department=self.dept, job_role=self.role, location=self.loc
        )

        self.category = CourseCategoryMaster.objects.create(category_name="Programming", category_code="PROG")
        self.course = CourseMaster.objects.create(
            course_title="Linked Course", course_code="LNK", 
            category=self.category
        )

    def test_training_planning_integration(self):
        """Verify that a session can link to a real CourseMaster."""
        calendar = TrainingCalendar.objects.create(year=2026, department=self.dept, created_by=self.employee)
        from django.utils import timezone
        import datetime
        
        session = TrainingSession.objects.create(
            course=self.course,
            calendar=calendar,
            session_title="Batch 1",
            session_start_date=timezone.now() + datetime.timedelta(days=1),
            session_end_date=timezone.now() + datetime.timedelta(days=2)
        )
        self.assertEqual(session.course.course_title, "Linked Course")

    def test_deletion_protection(self):
        """Verify that a course cannot be deleted if scheduled in a session (PROTECT)."""
        calendar = TrainingCalendar.objects.create(year=2026, department=self.dept, created_by=self.employee)
        from django.utils import timezone
        import datetime
        from django.db.models import ProtectedError

        TrainingSession.objects.create(
            course=self.course,
            calendar=calendar,
            session_title="Active Batch",
            session_start_date=timezone.now() + datetime.timedelta(days=1),
            session_end_date=timezone.now() + datetime.timedelta(days=2)
        )
        
        with self.assertRaises(ProtectedError):
            self.course.delete()

    def test_tni_compliance_integration(self):
        """Verify that mandatory compliance rules link to a real CourseMaster."""
        compliance = ComplianceTrainingRequirement.objects.create(
            job_role=self.role,
            course=self.course,
            mandatory=True,
            validity_days=365
        )
        self.assertEqual(compliance.course.course_code, "LNK")
