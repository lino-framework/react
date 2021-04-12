# -*- coding: utf-8 -*-
from lino.sphinxcontrib import configure
configure(globals())

extensions += ['lino.sphinxcontrib.logo']

# General information about the project.
project = "Lino React"
copyright = '2015-2021 Rumma & Ko Ltd'

html_title = "Lino React"

html_context.update(public_url='https://react.lino-framework.org')
