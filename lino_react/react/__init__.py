# -*- coding: UTF-8 -*-
# Copyright 2018 Rumma & Ko Ltd
# License: BSD (see file COPYING for details)

"""
A user interface for Lino applications that uses FaceBooks React JS framework.


.. autosummary::
   :toctree:

    views
    renderer
    models
"""

from lino.api.ad import Plugin


class Plugin(Plugin):
    # ui_label = _("React")
    ui_handle_attr_name = 'react_handle'

    needs_plugins = ['lino.modlib.jinja']

    url_prefix = 'react'

    media_name = 'react'

    # media_root = None
    # media_base_url = "http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/"

    def on_ui_init(self, kernel):

        from .renderer import Renderer
        self.renderer = Renderer(self)
        # ui.bs3_renderer = self.renderer
        kernel.extjs_renderer = self.renderer

    def get_patterns(self):
        from django.conf.urls import url
        from django.urls import path
        from . import views

        rx = '^'

        self.renderer.build_site_cache()

        urls = [
            url(rx + r'$', views.App.as_view()),
            url(rx + r'user/settings', views.UserSettings.as_view()),
            url(rx + r'auth$', views.Authenticate.as_view()),
            url(rx + r"null/", views.Null.as_view()),

            url(rx + r'api/main_html$', views.MainHtml.as_view()),

            path('dashboard/<int:index>', views.DashboardItem.as_view()),

            # To be fased out
            url(rx + r'restful/(?P<app_label>\w+)/(?P<actor>\w+)$',
                views.ApiList.as_view()),
            url(rx + r'restful/(?P<app_label>\w+)/(?P<actor>\w+)/(?P<pk>.+)$',
                views.ApiElement.as_view()),
            # From extjs
            url(rx + r'api/(?P<app_label>\w+)/(?P<actor>\w+)$',
                views.ApiList.as_view()),
            url(rx + r'api/(?P<app_label>\w+)/(?P<actor>\w+)/(?P<pk>[^/]+)$',
                views.ApiElement.as_view()),
            url(rx + r'api/(?P<app_label>\w+)/(?P<actor>\w+)/(?P<pk>[^/]+)/(?P<field>\w+)/suggestions$',
                views.Suggestions.as_view()),
            url(rx + r'choices/(?P<app_label>\w+)/(?P<rptname>\w+)$',
                views.Choices.as_view()),
            url(rx + r'choices/(?P<app_label>\w+)/(?P<rptname>\w+)/'
                     '(?P<fldname>\w+)$',
                views.Choices.as_view()),
            url(rx + r'apchoices/(?P<app_label>\w+)/(?P<actor>\w+)/'
                     '(?P<an>\w+)/(?P<field>\w+)$',
                views.ActionParamChoices.as_view()),
            # For generating views
            # url(rx + r'callbacks/(?P<thread_id>[\-0-9a-zA-Z]+)/'
            #          '(?P<button_id>\w+)$',
            #     views.Callbacks.as_view()),
            #
            url(rx+ r'choicelists/',
                views.ChoiceListModel.as_view()),

            # url(rx + "static/(?<Pstatic_path>.+)",
            #     views.StaticRedirect.as_view())

        ]
        return urls

    def get_detail_url(self, ar, actor, pk, *args, **kw):
        return self.build_plain_url(
            "#",
            "api",
            actor.actor_id.replace(".", "/"),
            str(pk), *args, **kw)

    def get_used_libs(self, html=False):
        if html is not None:
            yield ("React", '16.6', "https://reactjs.org/")

    # def get_index_view(self):
    #     from . import views
    #     return views.App.as_view()
