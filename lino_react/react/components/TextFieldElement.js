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
import DomHandler from "primereact/domhandler";

import {LinoGrid} from "./LinoGrid";
import {debounce} from "./LinoUtils";

import classNames from 'classnames';
// import {ForeignKeyElement} from "./ForeignKeyElement";
import {Labeled, getValue, getHiddenValue, getDataKey, shouldComponentUpdate} from "./LinoComponents"


import Suggester from "./Suggester";


class TextFieldElement extends React.Component {
    constructor(props) {
        super();
        this.state = {
            value: (getValue(props))
        };
        this.shouldComponentUpdate = shouldComponentUpdate.bind(this);
        this.onTextChange = this.onTextChange.bind(this);
        this.props_update_value = debounce(props.update_value, 150);
        this.disableEnter = this.disableEnter.bind(this);
        this.enableEnter = this.enableEnter.bind(this);

        if (DomHandler.getViewport().width <= 600) {
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

    focus() {
        this.editor.quill.focus();
    }


    disableEnter() {
        if (this.editor.quill.keyboard.bindings[13]) {
            this.EnterHack = this.EnterHack ? this.EnterHack : this.editor.quill.keyboard.bindings[13];
            delete this.editor.quill.keyboard.bindings[13];
        }

    }

    enableEnter() {
        if (this.EnterHack) {
            this.editor.quill.keyboard.bindings[13] = this.EnterHack;
        }
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
            <div className={"l-editor-wrapper"}
                 style={{"padding-bottom": "42px", "display": "flex", "height": "99%"}}>

                <Suggester getElement={() => this.editor}
                           attachTo={() => this.editor && this.editor.editorElement}
                           actorId={this.props.actorId}
                           triggerKeys={window.App.state.site_data.suggestors}
                           field={this.props.elem.name}
                           id={this.props.id}
                           componentDidUpdate={(state) => {
                               if (state.triggered && state.suggestions.length && state.startPoint <= state.cursor.selectionStart && !state.text.includes("\n") ) {
                                   this.disableEnter();
                               }
                               else {
                                   this.enableEnter();
                               }
                           }}
                           optionSelected={({state, props, selected}) => {
                               let text = /*state.triggeredKey + */selected[0] + " "; // if you add the trigger key use retain-1 and delete+1 to remove the existing triggerkey
                               this.editor.quill.updateContents([
                                       {retain: state.startPoint},
                                       {delete: state.text.length},//obj.cursor.selection - obj.cursor.startPoint},// 'World' is deleted
                                       {insert: text}
                                   ].filter(action => action[Object.keys(action)[0]])
                               );
                               this.editor.quill.setSelection(state.startPoint + text.length);
                               setTimeout(() => this.editor.quill.keyboard.bindings[13] = this.EnterHack, 10)
                           }}
                >
                    <Editor //style={ {{/!*height: '100%'*!/}} }
                        headerTemplate={this.renderHeader()}
                        value={value}
                        ref={e => this.editor = e}
                        onTextChange={this.onTextChange}
                        onTextChange={this.onTextChange}/>
                </Suggester>
            </div>
            :
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