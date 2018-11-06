from lino_book.projects.lydia.settings import *


class Site(Site):
    default_ui = 'lino_react.react'
    project_name = "react_lydia6"
    title = "Lydia Lino React demo"
    languages = ['en', 'fr', 'de']
