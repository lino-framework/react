# -*- coding: UTF-8 -*-
# Copyright 2009-2018 Rumma & Ko Ltd
# License: BSD (see file COPYING for details)

"""Views for `lino_react.react`.
"""

from __future__ import division
from past.utils import old_div

import logging

from os import environ

import ast

logger = logging.getLogger(__name__)

from django import http
from django.db import models
from django.conf import settings
from django.views.generic import View
from django.core import exceptions
from django.utils.translation import ugettext as _
from django.utils.translation import get_language
from django.core.exceptions import PermissionDenied

# from django.contrib import auth
from lino.core import auth
from lino.utils import isiterable
from lino.utils.jsgen import py2js
from lino.core import fields

from lino.core.gfks import ContentType

# from lino.api import dd
from lino.core import constants
# from lino.core import auth
from lino.core.requests import BaseRequest
from lino.core.tablerequest import TableRequest
import json

from lino.core.views import requested_actor, action_request
from lino.core.views import json_response, json_response_kw

from lino.core.views import action_request
from lino.core.utils import navinfo
from etgen.html import E, tostring
from etgen import html as xghtml
from lino.core import kernel

from lino.modlib.users.utils import get_user_profile, with_user_profile

from lino.api import rt
import re
import cgi

from lino.core.elems import ComboFieldElement

from jinja2.exceptions import TemplateNotFound


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


# Taken from lino.modlib.extjs.views
NOT_FOUND = "%s has no row with primary key %r"


def elem2rec_empty(ar, ah, elem, **rec):
    """
    Returns a dict of this record, designed for usage by an EmptyTable.
    """
    # ~ rec.update(data=rh.store.row2dict(ar,elem))
    rec.update(data=elem._data)
    # ~ rec = elem2rec1(ar,ah,elem)
    # ~ rec.update(title=_("Insert into %s...") % ar.get_title())
    rec.update(title=ar.get_action_title())
    rec.update(id=-99998)
    # ~ rec.update(id=elem.pk) or -99999)
    if ar.actor.parameters:
        rec.update(
            param_values=ar.actor.params_layout.params_store.pv2dict(
                ar, ar.param_values))
    return rec


# class Callbacks(View):
#     def get(self, request, thread_id, button_id):
#         return settings.SITE.kernel.run_callback(request, thread_id, button_id)


class ApiElement(View):
    def get(self, request, app_label=None, actor=None, pk=None):
        ui = settings.SITE.kernel
        rpt = requested_actor(app_label, actor)

        action_name = request.GET.get(constants.URL_PARAM_ACTION_NAME,
                                      rpt.default_elem_action_name)
        ba = rpt.get_url_action(action_name)
        if ba is None:
            raise http.Http404("%s has no action %r" % (rpt, action_name))

        if pk and pk != '-99999' and pk != '-99998':
            # ~ ar = ba.request(request=request,selected_pks=[pk])
            # ~ print 20131004, ba.actor
            # Use url selected rows as selected PKs if defined, otherwise use the PK defined in the url path
            sr = request.GET.getlist(constants.URL_PARAM_SELECTED)
            if not sr:
                sr = [pk]
            ar = ba.request(request=request, selected_pks=sr)
            elem = ar.selected_rows[0]
        else:
            ar = ba.request(request=request)
            elem = None

        ar.renderer = ui.default_renderer
        ah = ar.ah

        fmt = request.GET.get(
            constants.URL_PARAM_FORMAT, ba.action.default_format)

        if not ar.get_permission():
            msg = "No permission to run {}".format(ar)
            # raise Exception(msg)
            raise PermissionDenied(msg)

        if ba.action.opens_a_window:
            # print("15022019", action_name)
            if fmt == constants.URL_FORMAT_JSON:
                if pk == '-99999':
                    elem = ar.create_instance()
                    datarec = ar.elem2rec_insert(ah, elem)
                elif pk == '-99998':
                    elem = ar.create_instance()
                    datarec = elem2rec_empty(ar, ah, elem)
                elif elem is None:
                    datarec = dict(
                        success=False, message=NOT_FOUND % (rpt, pk))
                else:
                    datarec = ar.elem2rec_detailed(elem)
                return json_response(datarec)

            after_show = ar.get_status(record_id=pk)
            tab = request.GET.get(constants.URL_PARAM_TAB, None)
            if tab is not None:
                tab = int(tab)
                after_show.update(active_tab=tab)

            return http.HttpResponse(
                ui.default_renderer.html_page(
                    request, ba.action.label,
                    on_ready=ui.default_renderer.action_call(
                        request, ba, after_show)))

        # if isinstance(ba.action, actions.RedirectAction):
        #     target = ba.action.get_target_url(elem)
        #     if target is None:
        #         raise http.Http404("%s failed for %r" % (ba, elem))
        #     return http.HttpResponseRedirect(target)

        if pk == '-99998':
            assert elem is None
            elem = ar.create_instance()
            ar.selected_rows = [elem]
        elif elem is None:
            raise http.Http404(NOT_FOUND % (rpt, pk))
        return settings.SITE.kernel.run_action(ar)

    def post(self, request, app_label=None, actor=None, pk=None):
        data = http.QueryDict(request.body)
        ar = action_request(
            app_label, actor, request, data, True,
            renderer=settings.SITE.plugins.react.renderer)
        if pk == '-99998':
            elem = ar.create_instance()
            ar.selected_rows = [elem]
        else:
            ar.set_selected_pks(pk)
        return settings.SITE.kernel.run_action(ar)

    def put(self, request, app_label=None, actor=None, pk=None):
        data = http.QueryDict(request.body)  # raw_post_data before Django 1.4
        # data = json.loads(request.body)
        # logger.info("20150130 %s", data)

        ar = action_request(
            app_label, actor, request, data, False,
            renderer=settings.SITE.plugins.react.renderer)
        ar.set_selected_pks(pk)
        return settings.SITE.kernel.run_action(ar)

    def delete(self, request, app_label=None, actor=None, pk=None):
        data = http.QueryDict(request.body)
        ar = action_request(
            app_label, actor, request, data, False,
            renderer=settings.SITE.plugins.react.renderer)
        ar.set_selected_pks(pk)
        return settings.SITE.kernel.run_action(ar)

    def old_delete(self, request, app_label=None, actor=None, pk=None):
        rpt = requested_actor(app_label, actor)
        ar = rpt.request(request=request)
        ar.set_selected_pks(pk)
        elem = ar.selected_rows[0]
        return delete_element(ar, elem)


class ApiList(View):
    def post(self, request, app_label=None, actor=None):
        ar = action_request(app_label, actor, request, request.POST, True)
        ar.renderer = settings.SITE.kernel.default_renderer
        return settings.SITE.kernel.run_action(ar)

    def get(self, request, app_label=None, actor=None):
        ar = action_request(app_label, actor, request, request.GET, True)
        # Add this hack to support the 'sort' param which is different in Extjs6.
        # if ar.order_by and ar.order_by[0]:
        #     _sort = ast.literal_eval(ar.order_by[0])
        #     sort = _sort[0]['property']
        #     if _sort[0]['direction'] and _sort[0]['direction'] == 'DESC':
        #         sort = '-' + sort
        #     ar.order_by = [str(sort)]
        if not ar.get_permission():
            msg = "No permission to run {}".format(ar)
            # raise Exception(msg)
            raise PermissionDenied(msg)

        ar.renderer = settings.SITE.kernel.default_renderer
        rh = ar.ah

        fmt = request.GET.get(
            constants.URL_PARAM_FORMAT,
            ar.bound_action.action.default_format)

        action_name = request.GET.get(constants.URL_PARAM_ACTION_NAME)

        if action_name:
            return settings.SITE.kernel.run_action(ar)

        if fmt == constants.URL_FORMAT_JSON:
            rows = [rh.store.row2list(ar, row)
                    for row in ar.sliced_data_iterator]
            total_count = ar.get_total_count()
            for row in ar.create_phantom_rows():
                if ar.limit is None or len(rows) + 1 < ar.limit or ar.limit == total_count + 1:
                    d = rh.store.row2list(ar, row)
                    rows.append(d)
                total_count += 1
            # assert len(rows) <= ar.limit
            kw = dict(count=total_count,
                      rows=rows,
                      success=True,
                      no_data_text=ar.no_data_text,
                      # title=str(ar.get_title()),
                      title=ar.get_title())
            if ar.actor.parameters:
                kw.update(
                    param_values=ar.actor.params_layout.params_store.pv2dict(
                        ar, ar.param_values))
            return json_response(kw)

        if fmt == constants.URL_FORMAT_HTML:
            after_show = ar.get_status()

            sp = request.GET.get(
                constants.URL_PARAM_SHOW_PARAMS_PANEL, None)
            if sp is not None:
                # ~ after_show.update(show_params_panel=sp)
                after_show.update(
                    show_params_panel=constants.parse_boolean(sp))

            # if isinstance(ar.bound_action.action, actions.ShowInsert):
            #     elem = ar.create_instance()
            #     rec = ar.elem2rec_insert(rh, elem)
            #     after_show.update(data_record=rec)

            kw = dict(on_ready=
            ar.renderer.action_call(
                ar.request,
                ar.bound_action, after_show))
            # ~ print '20110714 on_ready', params
            kw.update(title=ar.get_title())
            return http.HttpResponse(ar.renderer.html_page(request, **kw))

        if fmt == 'csv':
            # ~ response = HttpResponse(mimetype='text/csv')
            charset = settings.SITE.csv_params.get('encoding', 'utf-8')
            response = http.HttpResponse(
                content_type='text/csv;charset="%s"' % charset)
            if False:
                response['Content-Disposition'] = \
                    'attachment; filename="%s.csv"' % ar.actor
            else:
                # ~ response = HttpResponse(content_type='application/csv')
                response['Content-Disposition'] = \
                    'inline; filename="%s.csv"' % ar.actor

            # ~ response['Content-Disposition'] = 'attachment; filename=%s.csv' % ar.get_base_filename()
            w = ucsv.UnicodeWriter(response, **settings.SITE.csv_params)
            w.writerow(ar.ah.store.column_names())
            if True:  # 20130418 : also column headers, not only internal names
                column_names = None
                fields, headers, cellwidths = ar.get_field_info(column_names)
                w.writerow(headers)

            for row in ar.data_iterator:
                w.writerow([str(v) for v in rh.store.row2list(ar, row)])
            return response

        if fmt == constants.URL_FORMAT_PRINTER:
            if ar.get_total_count() > MAX_ROW_COUNT:
                raise Exception(_("List contains more than %d rows") %
                                MAX_ROW_COUNT)
            response = http.HttpResponse(
                content_type='text/html;charset="utf-8"')
            doc = xghtml.Document(force_text(ar.get_title()))
            doc.body.append(E.h1(doc.title))
            t = doc.add_table()
            # ~ settings.SITE.kernel.ar2html(ar,t,ar.data_iterator)
            ar.dump2html(t, ar.data_iterator, header_links=False)
            doc.write(response, encoding='utf-8')
            return response

        return settings.SITE.kernel.run_action(ar)


# Should we Refactor into lino.modlib.extjs.choicees_views.py and import?
#
# choices_for_field is copied line-for-line from lino.modlib.extjs.views.choices_for_field
def choices_for_field(ar, holder, field):
    """
    Return the choices for the given field and the given HTTP request
    whose `holder` is either a Model, an Actor or an Action.
    """
    if not holder.get_view_permission(ar.request.user.user_type):
        raise Exception(
            "{user} has no permission for {holder}".format(
                user=ar.request.user, holder=holder))
    # model = holder.get_chooser_model()
    chooser = holder.get_chooser_for_field(field.name)
    # logger.info('20140822 choices_for_field(%s.%s) --> %s',
    #             holder, field.name, chooser)
    if chooser:
        qs = chooser.get_request_choices(ar, holder)
        if not isiterable(qs):
            raise Exception("%s.%s_choices() returned non-iterable %r" % (
                holder.model, field.name, qs))
        if chooser.simple_values:
            def row2dict(obj, d):
                d[constants.CHOICES_TEXT_FIELD] = str(obj)
                d[constants.CHOICES_VALUE_FIELD] = obj
                return d
        elif chooser.instance_values:
            # same code as for ForeignKey
            def row2dict(obj, d):
                d[constants.CHOICES_TEXT_FIELD] = holder.get_choices_text(
                    obj, ar.request, field)
                d[constants.CHOICES_VALUE_FIELD] = obj.pk
                return d
        else:  # values are (value, text) tuples
            def row2dict(obj, d):
                d[constants.CHOICES_TEXT_FIELD] = str(obj[1])
                d[constants.CHOICES_VALUE_FIELD] = obj[0]
                return d
        return (qs, row2dict)

    if field.choices:
        qs = field.choices

        def row2dict(obj, d):
            if type(obj) is list or type(obj) is tuple:
                d[constants.CHOICES_TEXT_FIELD] = str(obj[1])
                d[constants.CHOICES_VALUE_FIELD] = obj[0]
            else:
                d[constants.CHOICES_TEXT_FIELD] = holder.get_choices_text(
                    obj, ar.request, field)
                d[constants.CHOICES_VALUE_FIELD] = str(obj)
            return d

        return (qs, row2dict)

    if isinstance(field, fields.VirtualField):
        field = field.return_type

    if isinstance(field, fields.RemoteField):
        field = field.field

    if isinstance(field, models.ForeignKey):
        m = field.remote_field.model
        t = m.get_default_table()
        qs = t.request(request=ar.request).data_iterator

        # logger.info('20120710 choices_view(FK) %s --> %s', t, qs.query)

        def row2dict(obj, d):
            d[constants.CHOICES_TEXT_FIELD] = holder.get_choices_text(
                obj, ar.request, field)
            d[constants.CHOICES_VALUE_FIELD] = obj.pk
            return d
    else:
        raise http.Http404("No choices for %s" % field)
    return (qs, row2dict)


# choices_response is copied line-for-line from lino.modlib.extjs.views.choices_response
def choices_response(actor, request, qs, row2dict, emptyValue):
    """
    :param actor: requesting Actor
    :param request: web request
    :param qs: list of django model QS,
    :param row2dict: function for converting data set into a dict for json
    :param emptyValue: The Text value to represent None in the choice-list
    :return: json web responce

    Filters data-set acording to quickseach
    Counts total rows in the set,
    Calculates offset and limit
    Adds None value
    returns
    """
    quick_search = request.GET.get(constants.URL_PARAM_FILTER, None)
    offset = request.GET.get(constants.URL_PARAM_START, None)
    limit = request.GET.get(constants.URL_PARAM_LIMIT, None)
    if isinstance(qs, models.QuerySet):
        qs = qs.filter(qs.model.quick_search_filter(quick_search)) if quick_search else qs
        count = qs.count()

        if offset:
            qs = qs[int(offset):]
            # ~ kw.update(offset=int(offset))

        if limit:
            # ~ kw.update(limit=int(limit))
            qs = qs[:int(limit)]

        rows = [row2dict(row, {}) for row in qs]

    else:
        rows = [row2dict(row, {}) for row in qs]
        if quick_search:
            txt = quick_search.lower()

            rows = [row for row in rows
                    if txt in row[constants.CHOICES_TEXT_FIELD].lower()]
        count = len(rows)
        rows = rows[int(offset):] if offset else rows
        rows = rows[:int(limit)] if limit else rows

    # Add None choice
    if emptyValue is not None and not quick_search:
        empty = dict()
        empty[constants.CHOICES_TEXT_FIELD] = emptyValue
        empty[constants.CHOICES_VALUE_FIELD] = None
        rows.insert(0, empty)

    return json_response_kw(count=count, rows=rows)
    # ~ return json_response_kw(count=len(rows),rows=rows)
    # ~ return json_response_kw(count=len(rows),rows=rows,title=_('Choices for %s') % fldname)


class ChoiceListModel(View):
    """
    Creates a large JSON model that contains all the choicelists + choices

    Note: This could be improved, or might cause issues due to changing language
    """

    def get(self, request):
        data = {str(cl): [{"key": py2js(c[0]).strip('"'), "text": py2js(c[1]).strip('"')} for c in cl.get_choices()] for
                cl in
                kernel.CHOICELISTS.values()}
        return json_response(data)


# Copied from lino.modlib.extjs.views.Choices line for line.
class Choices(View):
    def get(self, request, app_label=None, rptname=None, fldname=None, **kw):
        """If `fldname` is specified, return a JSON object with two
        attributes `count` and `rows`, where `rows` is a list of
        `(display_text, value)` tuples.  Used by ComboBoxes or similar
        widgets.

        If `fldname` is not specified, returns the choices for the
        `record_selector` widget.

        """
        rpt = requested_actor(app_label, rptname)
        emptyValue = None
        if fldname is None:
            ar = rpt.request(request=request)
            # ~ rh = rpt.get_handle(self)
            # ~ ar = ViewReportRequest(request,rh,rpt.default_action)
            # ~ ar = dbtables.TableRequest(self,rpt,request,rpt.default_action)
            # ~ rh = ar.ah
            # ~ qs = ar.get_data_iterator()
            qs = ar.data_iterator

            # ~ qs = rpt.request(self).get_queryset()

            def row2dict(obj, d):
                d[constants.CHOICES_TEXT_FIELD] = str(obj)
                # getattr(obj,'pk')
                d[constants.CHOICES_VALUE_FIELD] = obj.pk
                return d
        else:
            # NOTE: if you define a *parameter* with the same name as
            # some existing *data element* name, then the parameter
            # will override the data element here in choices view.
            field = rpt.get_param_elem(fldname)
            if field is None:
                field = rpt.get_data_elem(fldname)
            if field.blank:
                # logger.info("views.Choices: %r is blank",field)
                emptyValue = ''
            qs, row2dict = choices_for_field(rpt.request(request=request), rpt, field)

        return choices_response(rpt, request, qs, row2dict, emptyValue)


# Also coppied from extjs.views line for line
class ActionParamChoices(View):
    # Examples: `welfare.pcsw.CreateCoachingVisit`
    def get(self, request, app_label=None, actor=None, an=None, field=None, **kw):
        actor = requested_actor(app_label, actor)
        ba = actor.get_url_action(an)
        if ba is None:
            raise Exception("Unknown action %r for %s" % (an, actor))
        field = ba.action.get_param_elem(field)
        qs, row2dict = choices_for_field(ba.request(request=request), ba.action, field)
        if field.blank:
            emptyValue = '<br/>'
        else:
            emptyValue = None
        return choices_response(actor, request, qs, row2dict, emptyValue)


class Restful(View):
    """
    Used to collaborate with a restful Ext.data.Store.
    """

    def post(self, request, app_label=None, actor=None, pk=None):
        rpt = requested_actor(app_label, actor)
        ar = rpt.request(request=request)

        instance = ar.create_instance()
        # store uploaded files.
        # html forms cannot send files with PUT or GET, only with POST
        if ar.actor.handle_uploaded_files is not None:
            ar.actor.handle_uploaded_files(instance, request)

        data = request.POST.get('rows')
        data = json.loads(data)
        ar.form2obj_and_save(data, instance, True)

        # Ext.ensible needs list_fields, not detail_fields
        ar.set_response(
            rows=[ar.ah.store.row2dict(
                ar, instance, ar.ah.store.list_fields)])
        return json_response(ar.response)

    # def delete(self, request, app_label=None, actor=None, pk=None):
    #     rpt = requested_actor(app_label, actor)
    #     ar = rpt.request(request=request)
    #     ar.set_selected_pks(pk)
    #     return delete_element(ar, ar.selected_rows[0])

    def get(self, request, app_label=None, actor=None, pk=None):
        """
        Works, but is ugly to get list and detail
        """
        rpt = requested_actor(app_label, actor)

        action_name = request.GET.get(constants.URL_PARAM_ACTION_NAME,
                                      rpt.default_elem_action_name)
        fmt = request.GET.get(
            constants.URL_PARAM_FORMAT, constants.URL_FORMAT_JSON)
        sr = request.GET.getlist(constants.URL_PARAM_SELECTED)
        if not sr:
            sr = [pk]
        ar = rpt.request(request=request, selected_pks=sr)
        if pk is None:
            rh = ar.ah
            rows = [
                rh.store.row2dict(ar, row, rh.store.all_fields)
                for row in ar.sliced_data_iterator]
            kw = dict(count=ar.get_total_count(), rows=rows)
            kw.update(title=str(ar.get_title()))
            return json_response(kw)

        else:  # action_name=="detail": #ba.action.opens_a_window:

            ba = rpt.get_url_action(action_name)
            ah = ar.ah
            ar = ba.request(request=request, selected_pks=sr)
            elem = ar.selected_rows[0]
            if fmt == constants.URL_FORMAT_JSON:
                if pk == '-99999':
                    elem = ar.create_instance()
                    datarec = ar.elem2rec_insert(ah, elem)
                elif pk == '-99998':
                    elem = ar.create_instance()
                    datarec = elem2rec_empty(ar, ah, elem)
                elif elem is None:
                    datarec = dict(
                        success=False, message=NOT_FOUND % (rpt, pk))
                else:
                    datarec = ar.elem2rec_detailed(elem)
                return json_response(datarec)

    def put(self, request, app_label=None, actor=None, pk=None):
        rpt = requested_actor(app_label, actor)
        ar = rpt.request(request=request)
        ar.set_selected_pks(pk)
        elem = ar.selected_rows[0]
        rh = ar.ah

        data = http.QueryDict(request.body).get('rows')
        data = json.loads(data)
        a = rpt.get_url_action(rpt.default_list_action_name)
        ar = rpt.request(request=request, action=a)
        ar.renderer = settings.SITE.kernel.extjs_renderer
        ar.form2obj_and_save(data, elem, False)
        # Ext.ensible needs list_fields, not detail_fields
        ar.set_response(
            rows=[rh.store.row2dict(ar, elem, rh.store.list_fields)])
        return json_response(ar.response)


def http_response(ar, tplname, context):
    "Deserves a docstring"
    u = ar.get_user()
    lang = get_language()
    k = (u.user_type, lang)
    context = ar.get_printable_context(**context)
    context['ar'] = ar
    context['memo'] = ar.parse_memo  # MEMO_PARSER.parse
    env = settings.SITE.plugins.jinja.renderer.jinja_env
    template = env.get_template(tplname)

    response = http.HttpResponse(
        template.render(**context),
        content_type='text/html;charset="utf-8"')

    return response


# Give better name, does more then just XML, does all the connector responses.
def XML_response(ar, tplname, context):
    """
    Respone used for rendering XML views in react.
    Includes some helper functions for rendering.
    """
    # u = ar.get_user()
    # lang = get_language()
    # k = (u.user_type, lang)
    context = ar.get_printable_context(**context)
    context.update(constants=constants)
    # context['ar'] = ar
    # context['memo'] = ar.parse_memo  # MEMO_PARSER.parse
    env = settings.SITE.plugins.jinja.renderer.jinja_env
    try:
        template = env.get_template(tplname)
    except TemplateNotFound as e:
        return http.HttpResponseNotFound()

    def bind(*args):
        """Helper function to wrap a string in {}s"""
        args = [str(a) for a in args]
        return "{" + "".join(args) + "}"

    context.update(bind=bind)

    def p(*args):
        """Debugger helper; prints out all args put into the filter but doesn't include them in the template.
        usage: {{debug | p}}
        """
        print(args)
        return ""

    def zlib_compress(s):
        """
        Compress a complex value in order to get decompress by the controller afterwards
        :param s: value to get compressed.
        :return: Compressed value.
        """
        import zlib
        compressed = zlib.compress(str(s))
        return compressed.encode('base64')
        # return cgi.escape(s, quote=True)  # escapes "<", ">", "&" "'" and '"'

    def fields_search(searched_field, collections):
        """
        check if the fields is available in the set of collections
        :param searched_field: searched field
        :param collections: set of fields
        :return: True if the field is present in the collections,False otherwise.
        """
        if searched_field:
            for field in collections:
                if searched_field == field:
                    return True
        return False

    env.filters.update(dict(p=p, zlib_compress=zlib_compress, fields_search=fields_search))
    content_type = "text/xml" if tplname.endswith(".xml") else \
        "application/javascript" if tplname.endswith(".js") else \
            "application/json"
    response = http.HttpResponse(
        template.render(**context),
        content_type=content_type + ';charset="utf-8"')

    return response


def layout2html(ar, elem):
    wl = ar.bound_action.get_window_layout()
    # ~ print 20120901, wl.main
    lh = wl.get_layout_handle(settings.SITE.kernel.default_ui)

    items = list(lh.main.as_plain_html(ar, elem))
    # if navigator:
    #     items.insert(0, navigator)
    # ~ print tostring(E.div())
    # ~ if len(items) == 0: return ""
    return E.form(*items)


class MainHtml(View):
    def get(self, request, *args, **kw):
        """Returns a json struct for the main user dashboard."""
        # ~ logger.info("20130719 MainHtml")
        settings.SITE.startup()
        # ~ raise Exception("20131023")
        ar = BaseRequest(request)
        # Add to reqeust not ar, as there's error if passing ar to get_main_html
        request.requesting_panel = "dashboard-main"
        html = settings.SITE.get_main_html(
            request, extjs=settings.SITE.plugins.react)
        html = settings.SITE.plugins.react.renderer.html_text(html)
        ar.success(html=html)
        return json_response(ar.response, ar.content_type)


class DashboardItem(View):
    def get(self, request, index, *args, **kw):
        """Returns a rendered HTML version the requested user dashboard."""
        ar = BaseRequest(request)
        ar.renderer = settings.SITE.plugins.react.renderer
        ar.requesting_panel = f"dashboard-{index}"
        dash = ar.get_user().get_preferences().dashboard_items
        if len(dash) > index:
            html = ar.show_story([dash[index]])
        else:
            html = ""
        ar.success(html=html)
        return json_response(ar.response, ar.content_type)


class Null(View):
    """Just returns 200, used in an iframe to cause the browser to trigger "Do you want to remember this pw" dialog"""

    def post(self, request):
        return http.HttpResponse()

    def get(self, request):
        return http.HttpResponse()


class Authenticate(View):
    def get(self, request, *args, **kw):
        action_name = request.GET.get(constants.URL_PARAM_ACTION_NAME)
        if True or action_name == 'logout':
            username = request.session.pop('username', None)
            auth.logout(request)
            # request.user = settings.SITE.user_model.get_anonymous_user()
            # request.session.pop('password', None)
            # ~ username = request.session['username']
            # ~ del request.session['password']
            target = '/'
            return http.HttpResponseRedirect(target)

            # ar = BaseRequest(request)
            # ar.success("User %r logged out." % username)
            # return ar.renderer.render_action_response(ar)
        raise http.Http404()

    def post(self, request, *args, **kw):
        """logs the user in and builds the linoweb.js file for the logged in user"""
        username = request.POST.get('username')
        password = request.POST.get('password')
        # print(username, password)
        user = auth.authenticate(
            request, username=username, password=password)
        auth.login(request, user, backend=u'lino.core.auth.backends.ModelBackend')

        # target = '/user/settings/'
        def result():
            if not settings.SITE.build_js_cache_on_startup:
                settings.SITE.plugins.react.renderer.build_js_cache(False)
            # http.HttpResponseRedirect(target) # Seems that fetch has some issues with this...
            return json_response({"success": True})

        return with_user_profile(user.user_type, result)
        # ar = BaseRequest(request)
        # mw = auth.get_auth_middleware()
        # msg = mw.authenticate(username, password, request)
        # if msg:
        #     request.session.pop('username', None)
        #     ar.error(msg)
        # else:
        #     request.session['username'] = username
        #     # request.session['password'] = password
        #     # ar.user = request....
        #     ar.success(("Now logged in as %r" % username))
        #     # print "20150428 Now logged in as %r (%s)" % (username, user)
        # return ar.renderer.render_action_response(ar)


class App(View):
    """
    Main app entry point,
    Also builds linoweb file for current user type.
    Content is mostly in the :xfile:`react/main.html` template.
    """

    def get(self, request):

        user = request.user
        if True:  # user.user_type.level >= UserLevels.admin:
            if request.subst_user:
                user = request.subst_user

        def getit():

            ui = settings.SITE.plugins.react
            # if not settings.SITE.build_js_cache_on_startup:
            #     ui.renderer.build_js_cache(False)

            ar = BaseRequest(
                # user=user,
                request=request,
                renderer=ui.renderer)
            context = dict(
                # title=ar.get_title(),
                # heading=ar.get_title(),
                # main=main,
                request = request,
                user = user,  # Current user
            )
            context.update(ar=ar)

            context = ar.get_printable_context(**context)
            env = settings.SITE.plugins.jinja.renderer.jinja_env
            template = env.get_template("react/main.html")
            return http.HttpResponse(
                template.render(**context),
                content_type='text/html;charset="utf-8"')

        return with_user_profile(user.user_type, getit)


class UserSettings(View):
    """
    Ajax interface for getting the current session/user settings."""

    def get(self, request):
        request = BaseRequest(request)
        u = request.user
        su = request.subst_user
        su_name = request.subst_user.get_full_name() if su else ""

        not_anon = u.is_authenticated if type(u.is_authenticated) == bool else u.is_authenticated()

        def getit():
            if not settings.SITE.build_js_cache_on_startup:
                settings.SITE.plugins.react.renderer.build_js_cache(False)
            user_settings = dict(
                user_type=u.user_type,
                dashboard_items=len(u.get_preferences().dashboard_items),
                # [d.serialize() for d in u.get_preferences().dashboard_items],
                lv=str(settings.SITE.kernel.code_mtime),
                lang=get_language(),
                site_data=settings.SITE.build_media_url(*settings.SITE.plugins.react.renderer.lino_js_parts()),
                logged_in=not_anon,
                username=u.get_full_name() if not_anon else _("Anonymous"),
                su_name=su_name,  # subst_user # must be passed as param in get_user_settings request,
                act_as_subtext=_("You are authorised to act as the following users."),
                act_as_title_text=_("Act as another user"),
                act_as_button_text=_("Act as another user"),
                act_as_self_text=_("Stop acting as another user"),
                # #3070: Add id and the text of "My setting" menu
                my_setting_text=_("My settings"),
                user_id=u.pk,
            )
            if su_name:
                user_settings["user_id"] = user_settings["su_id"] = su.id
                user_settings["su_user_type"] = su.user_type


            if not_anon:
                user_settings["authorities"] = u.get_authorities()

            return json_response(user_settings)


        return with_user_profile((su or u).user_type, getit)


class Suggestions(View):
    def get(self, request, app_label=None, actor=None, pk=None, field=None):
        suggesters = settings.SITE.plugins.memo.parser.suggesters
        trigger = request.GET.get("trigger")
        query = request.GET.get("query")
        return json_response(
            {"suggestions": list(suggesters[trigger].get_suggestions(query))}
        )

# class Index(View):
#     """
#     Render the main dashboard.
#     """

#     def get(self, request, *args, **kw):
#         # raise Exception("20171122 {} {}".format(
#         #     get_language(), settings.MIDDLEWARE_CLASSES))
#         ui = settings.SITE.plugins.openui5
#         # print("20170607", request.user)
#         # assert ui.renderer is not None
#         ar = BaseRequest(
#             # user=user,
#             request=request,
#             renderer=ui.renderer)
#         return index_response(ar)


# def index_response(ar):
#     ui = settings.SITE.plugins.openui5

#     main = settings.SITE.get_main_html(ar.request, extjs=ui)
#     main = ui.renderer.html_text(main)
#     context = dict(
#         title=settings.SITE.title,
#         main=main,
#     )
#     # if settings.SITE.user_model is None:
#     #     user = auth.AnonymousUser.instance()
#     # else:
#     #     user = request.subst_user or request.user
#     # context.update(ar=ar)
#     return http_response(ar, 'bootstrap3/index.html', context)
