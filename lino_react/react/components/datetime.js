import React, {Component} from "react";
import PropTypes from 'prop-types';
import {InputText} from 'primereact/inputtext';
import {Calendar} from 'primereact/calendar';
import {Labeled, getValue, getDataKey, shouldComponentUpdate, isDisabledField} from "./LinoComponents";


export class DateFieldElement extends React.Component {
    constructor() {
        super();
        this.update_props = this.update_props.bind(this);
    }

    update_props(e) {
        this.props.update_value(
            {[getDataKey(this.props)]: this.formatedDate(e.value)},
            this.props.elem,
            this.props.column);
    }

    convertValueToDate(value) {
        if (value instanceof Date) {
            return value
        }
        let parts = value ? value.split(".") : [];
        if (parts.length === 3) {
            return new Date(parts[2], parts[1] - 1, parts[0]);
        }
        return value
    }

    formatedDate(date) {
        if (date instanceof String) {
            return date
        }
        if (date instanceof Date) {
            let date_str = ("0" + date.getDate()).slice(-2) + "." +
                ("0" + (date.getMonth() + 1)).slice(-2) + "." +
                date.getFullYear();
            return date_str
        }
        return
    }

    render() {
        let {props} = this,
            value = getValue(props);
        return <Labeled {...props} elem={props.elem} labeled={props.labeled} isFilled={value}>
            {props.editing_mode && !isDisabledField(props) ?
                <Calendar style={{width: "100%"}}
                          //appendTo={window.App.topDiv}
                          showIcon={true}
                          keepInvalid={true}
                          value={this.convertValueToDate(value)}
                          dateFormat="dd.mm.yy"
                          onChange={(e) => {
                              if (e.originalEvent.target.value !== undefined && !(e.originalEvent.target.value.length < 10)) {
                                  if (this.convertValueToDate(e.value) instanceof Date) {
                                      if (this.props.inDialog) {
                                          this.props.update_value(this.formatedDate(e.value));
                                      } else {
                                          this.update_props(e);
                                      }
                                  }
                              }
                          }}
                          onSelect={(e) => {
                              if (this.props.inDialog) {
                                  this.props.update_value(this.formatedDate(e.value));
                              } else {
                                  this.update_props(e);
                              }
                          }}
                          onClearButtonClick={(e) => {e.value = ""; this.update_props(e)}}
                          yearNavigator yearRange="1900:2900"
                          showButtonBar={true}
                          showOnFocus={false}
                          ref={(el) => this.cal = el}
                          className={"l-DateFieldElement"}
                /> : <div dangerouslySetInnerHTML={{__html: value || "\u00a0"}}/>
            }
        </Labeled>
    }
}

export class IncompleteDateFieldElement extends React.Component {
    constructor() {
        super();
        this.shouldComponentUpdate = shouldComponentUpdate.bind(this);
    }

    focus() {
        this.cal.inputElement.focus()
    }

    render() {
        let {props} = this,
            value = (getValue(props));
        // if (typeof( value) === "string") value = new Date(value.replace(/\./g, '/'));
        return <Labeled {...props} elem={props.elem} labeled={props.labeled} isFilled={value}>
            {props.editing_mode && !isDisabledField(props) ?
                <InputText style={{width: "100%"}} type="text" keyfilter={/[\d\-\./]/}
                           value={value || ""}
                           onChange={(e) => props.update_value({[getDataKey(props)]: e.target.value},
                               props.elem,
                               props.column)}
                           ref={(el) => this.input = el}
                />
                : <div
                    dangerouslySetInnerHTML={{__html: value || "\u00a0"}}/>
            }
        </Labeled>
    }
}


export class TimeFieldElement extends React.Component {
    constructor() {
        super();
        this.shouldComponentUpdate = shouldComponentUpdate.bind(this);
        this.str2date = this.str2date.bind(this);
    }

    focus() {
        this.cal.inputElement.focus()
    }

    str2date(timeStr) {
        let regex = /^(\d(?:\d(?=[.,:; ]?\d\d|[.,:; ]\d|$))?)?[.,:; ]?(\d{0,2})$/g;
        if (timeStr && timeStr.match(regex)) {
            let m = regex.exec(timeStr),
                viewDate = new Date(),
                hours = m[1],
                min = m[2];
            viewDate.setHours(hours || 0);
            viewDate.setMinutes(min || 0);
            return viewDate
        }
        if (timeStr === "")
            return null;
        return false;
    }

    date2str(date) {
        return ("0" + date.getHours()).slice(-2) + ":" +
            ("0" + date.getMinutes()).slice(-2);
    }

    render() {
        let {props} = this,
            value = (getValue(props)),
            viewDate = this.str2date(value) || new Date();
        // if (typeof( value) === "string") value = new Date(value.replace(/\./g, '/'));
        return <Labeled {...props} elem={props.elem} labeled={props.labeled} isFilled={value}>
            {props.editing_mode && !isDisabledField(props) ?
                <Calendar style={{width: "100%"}} timeOnly={true} showTime={true}
                          inputStyle={{width: "100%"}}
                          value={value}
                          appendTo={window.App.topDiv}
                          keepInvalid={true}
                    // dateFormat="dd.mm.yy"
                          onChange={(e) => {
                              let time;
                              if (e.value instanceof Date) {
                                  time = this.date2str(e.value)
                              }
                              props.update_value({[getDataKey(props)]: time || e.value || ""},
                                  props.elem,
                                  props.column)
                          }}
                          onBlur={(e) => {
                              let value = getValue(props),
                                  dateValue = this.str2date(value);
                              // console.log(e, value, dateValue);
                              if (dateValue) {
                                  dateValue = this.date2str(dateValue)
                              } // convert to string
                              if (dateValue !== value) {
                                  props.update_value({[getDataKey(props)]: dateValue ? this.date2str(dateValue) : value},
                                      props.elem,
                                      props.column)
                              }
                          }}
                    // showIcon={true}
                          ref={(el) => this.cal = el}

                />
                :
                <div dangerouslySetInnerHTML={{__html: value || "\u00a0"}}/>}
        </Labeled>
    }
}
