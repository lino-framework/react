# -*- coding: UTF-8 -*-
# Copyright 2015-2018 Rumma & Ko Ltd
# License: BSD (see file COPYING for details)

import datetime

from ..settings import *


class Site(Site):
    the_demo_date = datetime.date(2015, 5, 23)
    languages = "en de fr"
    # readonly = True
    # default_user = 'anonymous'


SITE = Site(globals())

DEBUG = True

