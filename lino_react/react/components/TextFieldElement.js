import 'quill-mention';
import './TextFieldElement.css';

import React, {Component} from "react";
import PropTypes from "prop-types";

import {Panel} from 'primereact/panel';
import {Editor} from 'primereact/editor';

import queryString from 'query-string';
import {fetch as fetchPolyfill} from 'whatwg-fetch';

import {Labeled, getValue, getDataKey} from "./LinoComponents"


const atValue = [{ value: "Mention @People" }], hashValue = [{ value: "Tag #content" }];

class TextFieldElement extends React.Component {
    constructor(props) {
        super(props);
        this.onTextChange = this.onTextChange.bind(this);
        this.componentDidMount = this.componentDidMount.bind(this);
        this.mentionSource = this.mentionSource.bind(this);
        this.getSuggestions = this.getSuggestions.bind(this);
    }

    onTextChange(e) {
        let value = e.htmlValue || "";
        this.props.update_value({[getDataKey(this.props)]: value},
            this.props.elem,
            this.props.column)
    }

    componentDidMount() {
        this.suggestions = [];
    }

    getSuggestions(searchTerm, mentionChar) {
        let ajax_query = {
            query: searchTerm,
            trigger: mentionChar};

        fetchPolyfill(`suggestions?${queryString.stringify(ajax_query)}`).then(
            window.App.handleAjaxResponse
        ).then((data => {
            this.suggestions = data.suggestions;
        })).catch(error => window.App.handleAjaxException(error));
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
        let values = mentionChar === "@" ? atValue : hashValue;
        if (searchTerm.length === 0) {
            renderList(values, searchTerm);
        } else {
            this.getSuggestions(searchTerm, mentionChar);
            values = this.suggestions;
        }
        renderList(values, searchTerm);
    }

    render() {
        let style = {
                // height: "100%",
                // display: "flex",
                // flexDirection: "column"
            };

        let elem = this.props.editing_mode ?
            <React.Fragment>
                <Editor
                    style={{height: '90%', minHeight: '100px'}}
                    value={getValue(this.props)}
                    modules={{
                        mention: {
                            allowedChars: /^[A-Za-z0-9\s]*$/,
                            mentionDenotationChars: window.App.state.site_data.suggestors,
                            source: this.mentionSource,
                            renderItem: this.renderItem,
                            listItemClass: "l-s-selected",
                            mentionContainerClass: "l-suggester-suggestions",
                            mentionListClass: "l-l-suggester-suggestions",
                        }
                    }}
                    onTextChange={this.onTextChange}/>
            </React.Fragment> :
            <div dangerouslySetInnerHTML={{__html: getValue(this.props) || "\u00a0"}}/>;

        if (this.props.in_grid) return elem; // No wrapping needed

        if (this.props.editing_mode) {
            elem = <Labeled {...this.props} elem={this.props.elem} labeled={this.props.labeled}
                            isFilled={true} // either 1 or 0, can't be unfilled
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
