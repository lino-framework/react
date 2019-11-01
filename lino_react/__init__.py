"""
.. autosummary::
   :toctree:

    react
    projects

"""


import os

from os.path import join, dirname
fn = join(dirname(__file__), 'setup_info.py')
exec(compile(open(fn, "rb").read(), fn, 'exec'))
__version__ = SETUP_INFO['version']

# intersphinx_urls = dict(docs="http://react.lino-framework.org")
srcref_url = 'https://github.com/lino-framework/react/blob/master/%s'
doc_trees = ['docs']
intersphinx_urls = dict(docs="http://react.lino-framework.org")
