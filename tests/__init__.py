from lino.utils.pythontest import TestCase
from lino_react import SETUP_INFO


class PackagesTests(TestCase):
    def test_01(self):
        self.run_packages_test(SETUP_INFO['packages'])


class ProjectsTests(TestCase):
    
    def test_team(self):
        self.run_django_manage_test("lino_react/projects/teamReact")

    def test_lydia(self):
        self.run_django_manage_test("lino_react/projects/lydiaReact")

