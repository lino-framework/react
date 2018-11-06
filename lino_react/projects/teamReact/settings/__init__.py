# -*- coding: UTF-8 -*-
# Copyright 2015-2018 Rumma & Ko Ltd
# License: BSD (see file COPYING for details)
"""The :xfile:`settings.py` modules for this variant.

It has :attr:`default_user<lino.core.site.Site.default_user>` set to
'anonymous', which causes it to deactivate both authentication and
sessions.

.. autosummary::
   :toctree:

   demo
   doctests

"""


from lino_book.projects.team.settings.demo import *


class Site(Site):
    pass
    default_ui = 'lino_react.react'
    project_name = "react_teamReact"
    title = "Team Lino React demo"

    def get_installed_apps(self):
        yield super(Site, self).get_installed_apps()
        # Add the stars plugin because it gives a repeatable action for testing.
        # yield 'lino_xl.lib.stars'
