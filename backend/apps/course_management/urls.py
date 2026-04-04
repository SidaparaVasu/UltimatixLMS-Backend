from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseCategoryViewSet,
    CourseMasterViewSet,
    TagViewSet,
    CourseSectionViewSet,
    CourseLessonViewSet,
    CourseContentViewSet,
    CourseSkillMappingViewSet,
    CourseResourceViewSet,
    CourseDiscussionThreadViewSet,
    CourseDiscussionReplyViewSet
)

router = DefaultRouter()
router.register(r"categories", CourseCategoryViewSet, basename="course_categories")
router.register(r"courses", CourseMasterViewSet, basename="courses")
router.register(r"tags", TagViewSet, basename="course_tags")
router.register(r"sections", CourseSectionViewSet, basename="course_sections")
router.register(r"lessons", CourseLessonViewSet, basename="course_lessons")
router.register(r"content", CourseContentViewSet, basename="course_content")
router.register(r"skill-mappings", CourseSkillMappingViewSet, basename="course_skill_mappings")
router.register(r"resources", CourseResourceViewSet, basename="course_resources")
router.register(r"discussion-threads", CourseDiscussionThreadViewSet, basename="course_discussions")
router.register(r"discussion-replies", CourseDiscussionReplyViewSet, basename="course_discussion_replies")

urlpatterns = [
    path("", include(router.urls)),
]
