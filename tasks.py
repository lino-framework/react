from atelier.invlib import setup_from_tasks
ns = setup_from_tasks(
    globals(), "lino_react",
    languages="en de fr et".split(),
    # tolerate_sphinx_warnings=True,
    blogref_url = 'http://luc.lino-framework.org',
    revision_control_system='git',
    # locale_dir='lino_extjs/extjs/locale',
    cleanable_files=['docs/api/lino_react.*'],
    demo_projects=[
        'lino_react.projects.teamReact',
        'lino_react.projects.lydiaReact'])
