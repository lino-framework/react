import React from "react";
import ReactDOM from "react-dom";
import {Calendar} from "primereact/calendar";
import PropTypes from 'prop-types';
import { InputText } from 'primereact/inputtext';
import classNames from 'classnames';

Calendar.defaultProps.convertValueToDate = () => undefined;
Calendar.propTypes.convertValueToDate = PropTypes.func;

Calendar.prototype.isDateEquals = function isDateEquals (value, dateMeta) {
        if (value && typeof(value) === typeof("String")){
            value = this.props.convertValueToDate(value);
        }
        if(value && value instanceof Date)
            return value.getDate() === dateMeta.day && value.getMonth() === dateMeta.month && value.getFullYear() === dateMeta.year;
        else
            return false;
    }


Calendar.prototype.updateInputfield = (value) => {
    console.log(value);
};

Calendar.prototype.renderInputElement = function renderInputElement() {
        if (!this.props.inline) {
            const className = classNames('p-inputtext p-component', this.props.inputClassName);
            const value = this.getValueToRender();
            // console.log("render", value)
            return (
                <InputText ref={(el) => this.inputElement = ReactDOM.findDOMNode(el)} id={this.props.inputId} name={this.props.name} value={value} type="text" className={className} style={this.props.inputStyle}
                    readOnly={this.props.readOnlyInput} disabled={this.props.disabled} tabIndex={this.props.tabIndex} required={this.props.required} autoComplete="off" placeholder={this.props.placeholder}
                    onChange={this.onUserInput} onFocus={this.onInputFocus} onBlur={this.onInputBlur} onKeyDown={this.onInputKeyDown} />
            );
        }
        else {
            return null;
        }
    }

Calendar.prototype.getValueToRender = function getValueToRender() {
        let formattedValue = '';
        // debugger;
        if(this.props.value) {
            try {
                if(this.isSingleSelection()) {
                    formattedValue = this.formatDateTime(this.props.value);
                }
                else if(this.isMultipleSelection()) {
                    for(let i = 0; i < this.props.value.length; i++) {
                        let dateAsString = this.formatDateTime(this.props.value[i]);
                        formattedValue += dateAsString;
                        if(i !== (this.props.value.length - 1)) {
                            formattedValue += ', ';
                        }
                    }
                }
                else if(this.isRangeSelection()) {
                    if(this.props.value && this.props.value.length) {
                        let startDate = this.props.value[0];
                        let endDate = this.props.value[1];

                        formattedValue = this.formatDateTime(startDate);
                        if(endDate) {
                            formattedValue += ' - ' + this.formatDateTime(endDate);
                        }
                    }
                }
            }
            catch(err) {
                formattedValue = this.props.value;
            }
        }

        return formattedValue;
    }

export {Calendar};
