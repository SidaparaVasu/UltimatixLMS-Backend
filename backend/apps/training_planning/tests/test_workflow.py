from django.test import TestCase
from django.utils import timezone
import datetime
from apps.org_management.models import (
    CompanyMaster, BusinessUnitMaster, DepartmentMaster, 
    JobRoleMaster, EmployeeMaster, LocationMaster
)
from apps.training_planning.models import TrainingPlan, TrainingCalendar, TrainingSession, TrainingSessionEnrollment
from apps.training_planning.services import TrainingSessionEnrollmentService
from apps.training_planning.constants import EnrollmentStatus


class TrainingWorkflowTest(TestCase):
    def setUp(self):
        # 1. Base Setup
        self.company = CompanyMaster.objects.create(company_name="Test Co", company_code="TCO")
        self.bu = BusinessUnitMaster.objects.create(company=self.company, business_unit_name="Tech")
        self.dept = DepartmentMaster.objects.create(business_unit=self.bu, department_name="Backend")
        self.loc = LocationMaster.objects.create(company=self.company, location_name="HQ")
        self.role = JobRoleMaster.objects.create(job_role_name="Dev", job_role_code="DEV")
        
        self.emp1 = EmployeeMaster.objects.create(
            employee_code="E001", company=self.company, business_unit=self.bu, 
            department=self.dept, job_role=self.role, location=self.loc
        )
        self.emp2 = EmployeeMaster.objects.create(
            employee_code="E002", company=self.company, business_unit=self.bu, 
            department=self.dept, job_role=self.role, location=self.loc
        )

        self.calendar = TrainingCalendar.objects.create(
            year=2026, department=self.dept, created_by=self.emp1
        )

        # 2. Session with small capacity
        self.session = TrainingSession.objects.create(
            course_id=1,
            calendar=self.calendar,
            session_title="Micro Batch",
            capacity=1, # Capacity is only 1
            session_start_date=timezone.now() + datetime.timedelta(days=1),
            session_end_date=timezone.now() + datetime.timedelta(days=2)
        )

    def test_waitlist_conversion_on_capacity(self):
        """
        Verify that once capacity is reached, new sign-ups are set to WAITLIST.
        """
        service = TrainingSessionEnrollmentService()
        
        # 1st enrollment (Capacity 1)
        enr1 = service.enroll_employee(self.session.id, self.emp1.id)
        self.assertEqual(enr1.enrollment_status, EnrollmentStatus.ENROLLED)
        
        # 2nd enrollment (Should be waitlisted)
        enr2 = service.enroll_employee(self.session.id, self.emp2.id)
        self.assertEqual(enr2.enrollment_status, EnrollmentStatus.WAITLIST)

    def test_duplicate_enrollment_prevention(self):
        """
        Verify that get_or_create logic in service prevents duplicate Active enrollments.
        """
        service = TrainingSessionEnrollmentService()
        
        service.enroll_employee(self.session.id, self.emp1.id)
        count_before = TrainingSessionEnrollment.objects.count()
        
        service.enroll_employee(self.session.id, self.emp1.id)
        count_after = TrainingSessionEnrollment.objects.count()
        
        self.assertEqual(count_before, count_after)
