from django.test import TestCase
from django.db.utils import IntegrityError
from apps.course_management.models import (
    CourseCategoryMaster, CourseMaster, TagMaster, CourseTagMap, 
    CourseSection, CourseLesson, CourseContent, CourseSkillMapping
)
from apps.skill_management.models import SkillMaster, SkillLevelMaster
from apps.org_management.models import CompanyMaster, BusinessUnitMaster, DepartmentMaster, LocationMaster, JobRoleMaster, EmployeeMaster


class CourseModelTest(TestCase):
    def setUp(self):
        # 1. Base Org setup
        self.company = CompanyMaster.objects.create(company_name="Test Corp", company_code="TC")
        self.bu = BusinessUnitMaster.objects.create(company=self.company, business_unit_name="Tech")
        self.dept = DepartmentMaster.objects.create(business_unit=self.bu, department_name="Backend")
        self.loc = LocationMaster.objects.create(company=self.company, location_name="UK")
        self.role = JobRoleMaster.objects.create(job_role_name="Dev", job_role_code="DV")
        self.employee = EmployeeMaster.objects.create(
            employee_code="E001", company=self.company, business_unit=self.bu,
            department=self.dept, job_role=self.role, location=self.loc
        )

        # 2. Category
        self.category = CourseCategoryMaster.objects.create(
            category_name="Programming", category_code="PROG"
        )

        # 3. Course Master
        self.course = CourseMaster.objects.create(
            course_title="Python 101",
            course_code="PY101",
            category=self.category,
            created_by=self.employee
        )

        # 4. Skills
        self.skill = SkillMaster.objects.create(skill_name="Python", skill_code="PYT")
        self.level = SkillLevelMaster.objects.create(level_name="Beginner", level_rank=1)

    def test_course_hierarchy_persistence(self):
        """Verify that sections, lessons and contents link correctly."""
        section = CourseSection.objects.create(course=self.course, section_title="Ch1: Basics", display_order=1)
        lesson = CourseLesson.objects.create(section=section, lesson_title="Intro", display_order=1)
        content = CourseContent.objects.create(lesson=lesson, content_type="VIDEO", display_order=1)

        self.assertEqual(self.course.sections.count(), 1)
        self.assertEqual(section.lessons.count(), 1)
        self.assertEqual(lesson.contents.count(), 1)

    def test_skill_mapping_uniqueness(self):
        """Ensure duplicate skill-course mappings are blocked at DB level."""
        CourseSkillMapping.objects.create(course=self.course, skill=self.skill, target_level=self.level)
        
        with self.assertRaises(IntegrityError):
            # Mapping SAME skill to SAME course again
            CourseSkillMapping.objects.create(course=self.course, skill=self.skill, target_level=self.level)

    def test_tag_uniqueness(self):
        """Ensure tag names are unique."""
        TagMaster.objects.create(tag_name="AI")
        with self.assertRaises(IntegrityError):
            TagMaster.objects.create(tag_name="AI")

    def test_tag_consistency(self):
        """Ensure the same tag cannot be applied to the same course twice."""
        tag = TagMaster.objects.create(tag_name="Cloud")
        CourseTagMap.objects.create(course=self.course, tag=tag)
        with self.assertRaises(IntegrityError):
            CourseTagMap.objects.create(course=self.course, tag=tag)

    def test_large_file_path(self):
        """Verify that 500-char content URLs are supported."""
        section = CourseSection.objects.create(course=self.course, section_title="Ch1", display_order=1)
        lesson = CourseLesson.objects.create(section=section, lesson_title="Intro")
        
        long_url = "https://" + ("a" * 480) + ".com/v"
        content = CourseContent.objects.create(
            lesson=lesson, 
            content_type="VIDEO", 
            content_url=long_url,
            display_order=1
        )
        self.assertEqual(content.content_url, long_url)

    def test_cascade_deletion(self):
        """Verify that deleting a course cleans up its hierarchy."""
        section = CourseSection.objects.create(course=self.course, section_title="To be deleted", display_order=1)
        lesson = CourseLesson.objects.create(section=section, lesson_title="Lesson 1")
        
        self.course.delete()
        
        # Section and Lesson should be purged
        self.assertEqual(CourseSection.objects.filter(id=section.id).count(), 0)
        self.assertEqual(CourseLesson.objects.filter(id=lesson.id).count(), 0)
