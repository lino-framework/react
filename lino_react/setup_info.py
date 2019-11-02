# -*- coding: UTF-8 -*-
# Copyright 2015-2019 Rumma & Ko Ltd
# License: BSD (see file COPYING for details)

from __future__ import unicode_literals

SETUP_INFO = dict(
    name='lino_react',
    version='19.11.0',
    install_requires=['lino'],
    tests_require=[],
    test_suite='tests',
    description="The React user interface for Lino",
    license='BSD-2-Clause',
    include_package_data=False,
    zip_safe=False,
    author='Rumma & Ko Ltd',
    author_email='info@lino-framework.org',
    url="http://www.lino-framework.org",
    classifiers="""\
  Programming Language :: Python
  Programming Language :: Python :: 3
  Development Status :: 5 - Production/Stable
  Environment :: Web Environment
  Framework :: Django
  Intended Audience :: Developers
  Intended Audience :: System Administrators
  License :: OSI Approved :: BSD License
  Natural Language :: English
  Natural Language :: French
  Natural Language :: German
  Operating System :: OS Independent
  Topic :: Database :: Front-Ends
  Topic :: Home Automation
  Topic :: Office/Business
  Topic :: Software Development :: Libraries :: Application Frameworks""".splitlines())

SETUP_INFO.update(long_description="""\

The React user interface for Lino

The central project homepage is http://react.lino-framework.org/


""")

SETUP_INFO.update(packages=[str(n) for n in """
lino_react
lino_react.react
lino_react.projects
lino_react.projects.teamReact
lino_react.projects.teamReact.settings
lino_react.projects.teamReact.tests
lino_react.projects.lydiaReact
lino_react.projects.lydiaReact.settings
lino_react.projects.lydiaReact.tests
""".splitlines() if n])
