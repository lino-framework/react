import 'quill-mention';
import './TextFieldElement.css';

import React, {Component} from "react";
import PropTypes from "prop-types";

import key from "weak-key";

import {TabPanel, TabView} from 'primereact/tabview';
import {Panel} from 'primereact/panel';
import {InputText} from 'primereact/inputtext';
import {Checkbox} from 'primereact/checkbox';
import {Editor} from 'primereact/editor';
import {Button} from 'primereact/button';
import {Dropdown} from 'primereact/dropdown';
import {Password} from 'primereact/password';
import {Calendar} from 'primereact/calendar';

import queryString from 'query-string';
import {fetch as fetchPolyfill} from 'whatwg-fetch';

import {LinoGrid} from "./LinoGrid";
import {debounce, getViewport} from "./LinoUtils";

import classNames from 'classnames';
import {Labeled, getValue, getHiddenValue, getDataKey, shouldComponentUpdate} from "./LinoComponents"

const atValue = [{ value: "Mention @People" }], hashValue = [{ value: "Tag #content" }];

class TextFieldElement extends React.Component {
    constructor(props) {
        super();
        this.state = {
            value: (getValue(props)),
        };
        this.onTextChange = this.onTextChange.bind(this);
        this.props_update_value = debounce(props.update_value, 150);
        this.fixHeight = debounce(this.fixHeight.bind(this), 50);
        this.componentDidMount = this.componentDidMount.bind(this);
        this.componentDidUpdate = this.componentDidUpdate.bind(this);
        this.mentionSource = this.mentionSource.bind(this);
        this.getSuggestions = this.getSuggestions.bind(this);
        if (getViewport().width <= 600) {
            this.header = ( // This will onlyl update on remounting, but thats OK as quill doesn't like changing header
                <span className="ql-formats">
                    <button className="ql-bold" aria-label="Bold"/>
                    <button className="ql-italic" aria-label="Italic"/>
                    <button className="ql-underline" aria-label="Underline"/>
                </span>
            );
        }
    }

    static getDerivedStateFromProps(props, state) {
        let newPropValue = getValue(props);
        if (newPropValue !== state.value) {
            return {value: newPropValue}
        }
        return null;
    }

    renderHeader() {
        return this.header ? this.header : undefined //
    }

    onTextChange(e) {
        let {props} = this,
            value = e.htmlValue || "";
        this.setState({value: value});
        this.props_update_value({[getDataKey(props)]: value},
            props.elem,
            props.column)

    }

    fixHeight() {
        // console.log("20201205 fixHeight()", this.wrapperdiv);
        if (!this.wrapperdiv) {
            return
        }
        this.wrapperdiv.style["height"] = "100%"; // resets height

        this.fhTimeout = setTimeout(() => {
                let component = this.wrapperdiv.parentElement;
                this.wrapperdiv.style["height"] = component.offsetHeight - 10 + "px";
                this.wrapperdiv.style["padding-bottom"] = "25px";
            }
            , 20);
    }

    componentDidMount(props) {
        this.fixHeight();
        window.addEventListener('resize', this.fixHeight);
    }

    componentDidUpdate(props, state) {
        // console.log("20201205 componentDidUpdate()");
        if (this.props.editing_mode !== props.editing_mode
            ||
            this.props.dialogMaximised!== props.dialogMaximised) {
            this.fixHeight();
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.fixHeight);
    }

    getSuggestions(text, mentionChar) {
        let ajax_query = {
            query: text,
            trigger: mentionChar,
            start: 0,
            limit: 8,},
            id = this.props.id === undefined ? "-99999" : this.props.id,
            actorID = this.props.actorId.replace(".", "/");
        fetchPolyfill(`api/${actorID}/${id}/${this.props.elem.name}/suggestions?${queryString.stringify(ajax_query)}`).then(
            window.App.handleAjaxResponse
        ).then((data) => {
            return data.suggestions
        }).catch(error => window.App.handleAjaxException(error));
    }

    mentionSource(searchTerm, renderList, mentionChar) {
        let values = mentionChar === "@" ? atValue : hashValue;
        if (searchTerm.length === 0) {
            renderList(values, searchTerm);
        } else {
            values = this.getSuggestions(searchTerm, mentionChar);
        }
        renderList(values, searchTerm);
    }

    render() {
        let {props} = this,
            {value} = this.state,
            style = {
                height: "100%",
                display: "flex",
                flexDirection: "column"
            };

        let elem = props.editing_mode ?
            <div style={{display: "relative", height: "100%", width: "100%"}}>
                <div className={"l-editor-wrapper"}
                     ref={(el) => this.wrapperdiv = el}
                     style={{"display": "flex", "height": "99%"}}>
                        <Editor //style={ {{/!*height: '100%'*!/}} }
                            headerTemplate={this.renderHeader()}
                            value={value}
                            modules={{
                                mention: {
                                    allowedChars: /^[A-Za-z0-9\s]*$/,
                                    mentionDenotationChars: window.App.state.site_data.suggestors,
                                    source: this.mentionSource,
                                    listItemClass: "l-s-selected",
                                    mentionContainerClass: "l-suggester-suggestions",
                                    mentionListClass: "l-l-suggester-suggestions",
                                }
                            }}
                            ref={e => this.editor = e}
                            onTextChange={this.onTextChange}/>
                </div>
            </div> :
            <div dangerouslySetInnerHTML={{__html: value || "\u00a0"}}/>;

        if (props.in_grid) return elem; // No wrapping needed

        if (props.editing_mode) {
            elem = <Labeled {...props} elem={props.elem} labeled={props.labeled}
                            isFilled={true} // either 1 or 0, can't be unfilled
            > {elem} </Labeled>
        } else {
            elem = <Panel header={props.elem.label} style={style}>
                {elem}
            </Panel>
        }

        return elem
    }
}

export default TextFieldElement;
