from .demo import *

SITE = Site(
    globals(),
    remote_user_header='REMOTE_USER')
DEBUG = True

SITE.default_build_method = "appyodt"
SITE.webdav_url = '/'
