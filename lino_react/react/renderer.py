# -*- coding: UTF-8 -*-
# Copyright 2012-2017 Luc Saffre
# License: BSD (see file COPYING for details)


from __future__ import unicode_literals

from builtins import str
import six

from cgi import escape

from django.conf import settings
from django.db import models
from django.utils.text import format_lazy

from lino.core import constants as ext_requests
from lino.core.renderer import add_user_language, JsRenderer, HtmlRenderer
from lino.core.renderer_mixins import JsCacheRenderer

from lino.core.menus import Menu, MenuItem
from lino.core import constants
from lino.core import choicelists
from lino.core.gfks import ContentType
from lino.modlib.extjs.ext_renderer import ExtRenderer

from lino.core.actions import (ShowEmptyTable, ShowDetail,
                               ShowInsert, ShowTable, SubmitDetail,
                               SubmitInsert)
from lino.core.boundaction import BoundAction
from lino.core.choicelists import ChoiceListMeta
from lino.core.actors import Actor
from lino.core.layouts import LayoutHandle
from lino.core.elems import LayoutElement, ComboFieldElement
from lino.core import kernel

from etgen.html import E

from lino.utils import jsgen
from lino.utils.jsgen import py2js, js_code, obj2dict

from lino.modlib.users.utils import get_user_profile, with_user_profile

from inspect import isclass


def find(itter, target, key=None):
    """Returns the index of an element in a callable which can be use a key function"""
    assert key == None or callable(key), "key shold be a function that takes the itter's item " \
                                         "and returns that wanted matched item"
    for i, x in enumerate(itter):
        if key:
            x = key(x)
        if x == target:
            return i
    else:
        return -1


class Renderer(JsRenderer, JsCacheRenderer):
    """.
        An JS renderer that uses the react Javascript framework.
    """
    is_interactive = True
    can_auth = True

    lino_web_template = "react/linoweb.json"
    file_type = '.json'

    def __init__(self, plugin):
        super(JsRenderer, self).__init__(plugin)
        JsCacheRenderer.__init__(self)
        jsgen.register_converter(self.py2js_converter)

    def write_lino_js(self, f):
        """

        :param f: File object
        :return: 1
        """
        self.serialise_js_code = True
        choicelists_data = {
            ID: [{"value": py2js(c[0]).strip('"'), "text": py2js(c[1]).strip('"')} for c in cl.get_choices()] for
            ID, cl in
            kernel.CHOICELISTS.items()}
        f.write(py2js(dict(actors={a.actor_id: a for a in self.actors_list},
                           menu=settings.SITE.get_site_menu(get_user_profile()),
                           choicelists=choicelists_data),
                      compact=not settings.SITE.is_demo_site))
        self.serialise_js_code = False
        return 1

    # working, but shouldn't be used, as it clears the app history
    def get_detail_url(self, actor, pk, *args, **kw):
        """Opens detail however clears the app's history"""
        return self.plugin.build_plain_url(
            "#",
            "detail",
            actor.actor_id,
            str(pk), *args, **kw)

    def get_request_url(self, ar, *args, **kw):
        """Used for turn requests into urls"""
        if ar.actor.__name__ == "Main":
            return self.plugin.build_plain_url(*args, **kw)

        st = ar.get_status()
        kw.update(st['base_params'])
        add_user_language(kw, ar)
        if ar.offset is not None:
            kw.setdefault(ext_requests.URL_PARAM_START, ar.offset)
        if ar.limit is not None:
            kw.setdefault(ext_requests.URL_PARAM_LIMIT, ar.limit)
        if ar.order_by is not None:
            sc = ar.order_by[0]
            if sc.startswith('-'):
                sc = sc[1:]
                kw.setdefault(ext_requests.URL_PARAM_SORTDIR, 'DESC')
            kw.setdefault(ext_requests.URL_PARAM_SORT, sc)
        # ~ print '20120901 TODO get_request_url

        return self.plugin.build_plain_url(
            ar.actor.app_label, ar.actor.__name__, *args, **kw)

    # from extrenderer
    def action_button(self, obj, ar, ba, label=None, **kw):
        label = label or ba.get_button_label()
        if len(label) == 1:
            label = "\u00A0{}\u00A0".format(label)
            # label = ONE_CHAR_LABEL.format(label)
        if ba.action.parameters and not ba.action.no_params_window:
            st = self.get_action_status(ar, ba, obj)
            return self.window_action_button(
                ar, ba, st, label, **kw)
        if ba.action.opens_a_window:
            st = ar.get_status()
            if obj is not None:
                st.update(record_id=obj.pk)
            return self.window_action_button(ar, ba, st, label, **kw)
        return self.row_action_button(obj, ar, ba, label, **kw)

    # from extrendere
    def action_call_on_instance(
            self, obj, ar, ba, request_kwargs={}, **status):
        """Note that `ba.actor` may differ from `ar.actor` when defined on a
        different actor. Remember e.g. the "Must read eID card" action
        button in eid_info of newcomers.NewClients (20140422).

        :obj:  The database object
        :ar:   The action request
        :ba:  The bound action
        :request_kwargs: keyword arguments to forwarded to the child action request

        Any kwyword other arguments are forwarded to :meth:`ar2js`.

        """
        if ar is None:
            sar = ba.request(**request_kwargs)
        else:

            sar = ar.spawn(ba, **request_kwargs)
        return self.ar2js(sar, obj, **status)

    def get_action_params(self, ar, ba, obj, **kw):
        if ba.action.parameters:
            fv = ba.action.params_layout.params_store.pv2list(
                ar, ar.action_param_values)
            kw[constants.URL_PARAM_FIELD_VALUES] = fv
        return kw

    def ar2js(self, ar, obj, **status):
        """Implements :meth:`lino.core.renderer.HtmlRenderer.ar2js`.

        """
        rp = ar.requesting_panel
        ba = ar.bound_action
        params = {}
        if ba.action.is_window_action():
            # is_window_action is known in the json file, just run action as normal
            # Unsure what data is added with this, but likely want to include it.
            # print("1.19.2019", status)
            status.update(self.get_action_status(ar, ba, obj))
            params.update(status)
        params.update(self.get_action_params(ar, ba, obj))
        return "window.App.runAction(%s)" % (
            py2js({
                "rp": rp,
                "an": ba.action.action_name,
                "onMain": ar.is_on_main_actor,
                "actorId": ba.actor.actor_id,
                "sr": obj.pk if obj is not None else None,
                "status": params
            }))
        # bound_action.a)

    def py2js_converter(self, v):
        """
        Additional converting logic for serializing Python values to json.
        """
        if v is settings.SITE.LANGUAGE_CHOICES:
            return js_code('LANGUAGE_CHOICES')
        if isinstance(v, choicelists.Choice):
            """
            This is special. We don't render the text but the value.
            """
            return v.value
        if isinstance(v, models.Model):
            return v.pk
        if isinstance(v, Exception):
            return str(v)
        if isinstance(v, Menu):
            if v.parent is None:
                return v.items
                # kw.update(region='north',height=27,items=v.items)
                # return py2js(kw)
            return dict(text=v.label, menu=dict(items=v.items))

        if isinstance(v, MenuItem):
            if v.instance is not None:
                h = self.instance_handler(None, v.instance, None)
                assert h is not None
                js = "%s" % h
                return self.handler_item(v, h, None)
            elif v.bound_action is not None:
                if v.params:
                    ar = v.bound_action.request(**v.params)
                    js = self.request_handler(ar)
                else:
                    js = self.action_call(None, v.bound_action, {})
                return self.handler_item(v, js, v.help_text)

            elif v.javascript is not None:
                js = "%s" % v.javascript
                return self.handler_item(v, js, v.help_text)
            elif v.href is not None:
                url = v.href
            # ~ elif v.request is not None:
            # ~ raise Exception("20120918 request %r still used?" % v.request)
            # ~ url = self.get_request_url(v.request)
            else:
                # a separator
                # ~ return dict(text=v.label)
                return v.label
                # ~ url = self.build_url('api',v.action.actor.app_label,v.action.actor.__name__,fmt=v.action.name)
            if v.parent.parent is None:
                # special case for href items in main menubar
                return dict(
                    xtype='button', text=v.label,
                    # ~ handler=js_code("function() { window.location='%s'; }" % url))
                    handler=js_code("function() { Lino.load_url('%s'); }" % url))
            return dict(text=v.label, href=url)
        if issubclass(v.__class__, LayoutElement):
            # Layout elems
            result = dict(label=v.get_label(),
                          repr=repr(v),
                          react_name=v.__class__.__name__)  # Used for choosing correct react component
            if hasattr(v, "elements"):
                result['items'] = v.elements
            result.update(obj2dict(v, "fields_index editable vertical hpad is_fieldset name width preferred_width\
                                      hidden value hflex vflex"))
            # result["width"] = v.width or v.preferred_width
            # Slave tables
            if hasattr(v, "actor"):
                # reference to actor data for slave-grids
                result.update(obj2dict(v.actor, "actor_id"))  # to get siteDate layout index

            if hasattr(v, "get_field_options"):
                result.update(field_options=v.get_field_options())

            return result
        if isinstance(v, LayoutHandle):
            # Layout entry-point
            return dict(main=v.main)
        if isinstance(v, BoundAction):

            # todo include all aux info
            # todo include grid info
            # todo refactor this into a all_actions object and have the bound actions ref it to reduse json size
            result = dict(an=v.action.get_label(), # todo fix this, this is a readable action, not ID for the action
                          window_action=v.action.is_window_action(),
                          window_layout=v.get_layout_handel(),
                          )

            # if v.action.show_in_bbar: result["bbar"] = True # not needed
            if v.action.combo_group: result["combo_group"] = v.action.combo_group
            if v.action.select_rows: result['select_rows'] = v.action.select_rows

            return result
        if isclass(v) and issubclass(v, Actor):
            result = dict(id=v.actor_id,
                          ba=v._actions_dict,
                          label=v.get_actor_label(),
                          slave=bool(v.master)
                          # [py2js(b) for b in v.actions.items()]
                          )
            if v.default_action.action.window_type: result["toolbarActions"] = [ba.action.action_name for ba in
                                                                                v.get_toolbar_actions(
                                                                                    v.default_action.action)]
            # grids
            if hasattr(v.get_handle(), "get_columns"):
                result['col'] = v.get_handle().get_columns()
                index_mod = 0
                for c in result['col']:
                    c.fields_index = find(v.get_handle().store.list_fields, c.field.name,
                                          key=lambda f: f.name) + index_mod
                    if isinstance(c, ComboFieldElement):
                        # Skip the data value for multi value columns, such as choices and FK fields.
                        # use c.fields_index -1 for data value
                        index_mod += 1
            result.update(obj2dict(v.get_handle().store, "pk_index"))  # Data index which is the PK
            result.update(obj2dict(v, "preview_limit"))  # number of rows to render
            # mt + slave-tables
            if settings.SITE.is_installed('contenttypes') and getattr(v, 'model', None) is not None and hasattr(v.model, "_meta"):
                # Perhaps I should have the model also be py2js'd?
                result.update(content_type=ContentType.objects.get_for_model(v.model).pk)
            for a in "detail_action insert_action default_action".split(" "):
                if hasattr(v, a) and getattr(v, a) is not None:
                    result.update({a: getattr(v, a).action.action_name})

            return result

        if isinstance(v, js_code) and self.serialise_js_code:
            # Convert js_code into strings so they are serialised. rather than displayed w/o quotes
            return str(v.s)

        return v

    def handler_item(self, mi, handler, help_text):
        """"""
        # ~ handler = "function(){%s}" % handler
        # ~ d = dict(text=prepare_label(mi),handler=js_code(handler),tooltip="Foo")
        d = dict(text=mi.label, handler=handler)
        if mi.bound_action and mi.bound_action.action.icon_name:
            d.update(iconCls='x-tbar-' + mi.bound_action.action.icon_name)
        if settings.SITE.use_quicktips and help_text:
            # d.update(tooltip=help_text)
            # d.update(tooltipType='title')
            d.update(toolTip=help_text)
        return d

    # Todo
    def request_handler(self, ar, *args, **kw):
        """ Generates js string for action button calls.
            Needs to understand if it's a param action or simple action.
        """
        # js = super(ExtRenderer, self).request_handler(ar, *args, **kw)
        st = ar.get_status(**kw)
        return self.action_call(ar, ar.bound_action, st)

    def instance_handler(self, ar, obj, ba):
        # Used for navigation, currently working, due to action_call override
        return super(Renderer, self).instance_handler(ar, obj, ba)

    def action_call(self, request, bound_action, status):

        a = bound_action.action
        # fullname = ".".join(bound_action.full_name().rsplit(".", 1)[::-1])  # moves action name to first arg,
        actorId, an = bound_action.full_name().rsplit(".", 1)  # moves action name to first arg,

        if a.opens_a_window or (a.parameters and not a.no_params_window):
            if request and request.subst_user:
                status[
                    constants.URL_PARAM_SUBST_USER] = request.subst_user
            if isinstance(a, ShowEmptyTable):
                status.update(record_id=-99998)
            if request is None:
                rp = None
            else:
                rp = request.requesting_panel
            if not status:
                status = {}

            return "window.App.runAction(%s)" % py2js(dict(
                an=an,
                actorId=actorId,
                status=status,
                rp=rp))
            # return "%s()" % self.get_panel_btn_handler(bound_action)
        return "simple_action(%s)" % fullname

    def js2url(self, js):
        if not js:
            return None
        # Convert to string as currently window actions are py2js => dict
        if not isinstance(js, six.string_types):
            js = str(js)
        js = escape(js)
        return 'javascript:' + js

    def show_menu(self, ar, mnu, level=1):
        """
        Render the given menu as an HTML element.
        Used for writing test cases.
        """
        if not isinstance(mnu, Menu):
            assert isinstance(mnu, MenuItem)
            if mnu.bound_action:
                sar = mnu.bound_action.actor.request(
                    action=mnu.bound_action,
                    user=ar.user, subst_user=ar.subst_user,
                    requesting_panel=ar.requesting_panel,
                    renderer=self, **mnu.params)
                # print("20170113", sar)
                url = sar.get_request_url()
            else:
                url = mnu.href
            assert mnu.label is not None
            if url is None:
                return E.p()  # spacer
            return E.li(E.a(mnu.label, href=url, tabindex="-1"))

        items = [self.show_menu(ar, mi, level + 1) for mi in mnu.items]
        # ~ print 20120901, items
        if level == 1:
            return E.ul(*items, **{'class': 'nav navbar-nav'})
        if mnu.label is None:
            raise Exception("%s has no label" % mnu)
        if level == 2:
            cl = 'dropdown'
            menu_title = E.a(
                str(mnu.label), E.b(' ', **{'class': "caret"}), href="#",
                data_toggle="dropdown", **{'class': 'dropdown-toggle'})
        elif level == 3:
            menu_title = E.a(str(mnu.label), href="#")
            cl = 'dropdown-submenu'
        else:
            raise Exception("Menu with more than three levels")
        return E.li(
            menu_title,
            E.ul(*items, **{'class': 'dropdown-menu'}),
            **{'class': cl})

    def add_help_text(self, kw, help_text, title, datasource, fieldname):
        if settings.SITE.use_quicktips:
            if settings.SITE.show_internal_field_names:
                ttt = "(%s.%s) " % (datasource, fieldname)
            else:
                ttt = ''
            if help_text:
                ttt = format_lazy(u"{}{}", ttt, help_text)
            if ttt:
                # kw.update(qtip=self.field.help_text)
                # kw.update(toolTipText=self.field.help_text)
                # kw.update(tooltip=self.field.help_text)
                kw.update(quicktip="(%s,%s)" % (title,
                                                ttt))
