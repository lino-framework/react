import 'quill-mention';
import './TextFieldElement.css';

import React, {Component} from "react";
import PropTypes from "prop-types";

import {Panel} from 'primereact/panel';
import {Editor} from 'primereact/editor';

import queryString from 'query-string';
import AbortController from 'abort-controller';
import {fetch as fetchPolyfill} from 'whatwg-fetch';
import regeneratorRuntime from "regenerator-runtime"; // require for async request (in getting mention/tag suggestion)

import {Labeled, getValue, getDataKey} from "./LinoComponents"


const atValue = [{ value: "Mention @People" }], hashValue = [{ value: "Tag #content" }];

class TextFieldElement extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: getValue(props) || "",
        }
        this.onTextChange = this.onTextChange.bind(this);
        this.mentionSource = this.mentionSource.bind(this);
    }

    getSnapshotBeforeUpdate(prevProps, prevState) {
        if (getValue(prevProps) !== getValue(this.props)) {
            return "newValue"
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (snapshot === "newValue") {
            let value = getValue(this.props);
            if (this.state.value !== value) {
                this.setState({value: value});
            }
        }
    }

    componentDidMount() {
        this.controller = new AbortController();
    }

    componentWillUnmount() {
        this.controller.abort();
    }

    onTextChange(e) {
        let value = e.htmlValue || "";
        this.setState({value: value});
        this.props.update_value({[getDataKey(this.props)]: value},
            this.props.elem,
            this.props.column);
    }

    renderItem(item, searchTerm) {
        let value = "";
        if (item){
            if (item.value) {
                value += item.value;
            }
            if (item.description) {
                value += ": " + item.description;
            }
        }
        return value
    }

    mentionSource(searchTerm, renderList, mentionChar) {
        if (searchTerm.length === 0) {
            let values = mentionChar === "@" ? atValue : hashValue;
            renderList(values, searchTerm);
        } else {
            async function asyncFetch(searchTerm, renderList, mentionChar, signal) {
                let ajax_query = {
                    query: searchTerm,
                    trigger: mentionChar};
                const abortableFetch = ('signal' in new Request('')) ? window.fetch : fetchPolyfill;
                await abortableFetch(`suggestions?${queryString.stringify(ajax_query)}`, {signal: signal}).then(window.App.handleAjaxResponse).then(data => {
                    renderList(data.suggestions, searchTerm);
                }).catch(error => {
                    if (error.name === "AbortError") {
                        console.log("Request Aborted due to component unmount!");
                    } else {
                        window.App.handleAjaxException(error);
                    }
                });
            }
            asyncFetch(searchTerm, renderList, mentionChar, this.controller.signal);
        }
    }

    render() {
        let style = {
                height: "90%",
                display: "flex",
                flexDirection: "column",},
            elem = this.props.editing_mode ?
                <div
                    onKeyDown={(e) => {
                        if (this.props.in_grid && (((!e.shiftKey) && e.keyCode === 13) || e.keyCode === 9)) {
                            e.stopPropagation();
                        }
                    }}>
                    <Editor
                        ref={(e) => this.editor = e}
                        style={{height: '75%', minHeight: '80px'}}
                        value={this.state.value}
                        modules={{
                            mention: {
                                allowedChars: /^[A-Za-z0-9\s]*$/,
                                mentionDenotationChars: window.App.state.site_data.suggestors,
                                source: this.mentionSource,
                                renderItem: this.renderItem,
                                listItemClass: "l-s-selected",
                                mentionContainerClass: "l-suggester-suggestions",
                                mentionListClass: "l-l-suggester-suggestions",
                            },
                        }}
                        onTextChange={this.onTextChange}/>
                </div>
                : <div dangerouslySetInnerHTML={{__html: this.state.value || "\u00a0"}}/>;

        if (this.props.in_grid) return elem;

        if (this.props.editing_mode) {
            elem = <Labeled {...this.props} elem={this.props.elem} labeled={this.props.labeled}
                            isFilled={this.state.value}
            > {elem} </Labeled>
        } else {
            elem = <Panel header={this.props.elem.label} style={style}>
                {elem}
            </Panel>
        }

        return elem
    }
}

export default TextFieldElement;
