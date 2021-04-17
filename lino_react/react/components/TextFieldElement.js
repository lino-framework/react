import './TextFieldElement.css';

import React, {Component} from "react";
import PropTypes from "prop-types";

import {Panel} from 'primereact/panel';
import {Editor} from 'primereact/editor';
import {Button} from 'primereact/button';

import AbortController from 'abort-controller';

import {Labeled, getValue, getDataKey} from "./LinoComponents"
import {LinoEditor} from "./LinoEditor";
import {quillMention} from "./quillmodules";


class TextFieldElement extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            new_window: false,
            unsaved: false,
            value: getValue(props) || "",
        }
        this.controller = new AbortController();
        this.onTextChange = this.onTextChange.bind(this);
    }

    getSnapshotBeforeUpdate(prevProps, prevState) {
        if (getValue(prevProps) !== getValue(this.props)) {
            return "newValue"
        }
        return null
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

    }

    componentWillUnmount() {
        this.controller.abort();
        if (this.props.in_grid && this.state.unsaved) {
            this.props.column.onEditorSubmit({columnProps: this.props.column}, true);
            this.state.unsaved = false;
        }
    }

    onTextChange(e) {
        let value = e.htmlValue || "";
        if (!this.state.unsaved) this.setState({unsaved: true});
        this.setState({value: value});
        this.props.update_value({[getDataKey(this.props)]: value},
            this.props.elem,
            this.props.column);
    }

    render() {
        let elem = this.props.editing_mode ? <div
                style={{position: "relative", height: "75%"}}
                onKeyDown={(e) => {
                    if (this.props.in_grid && (((!e.shiftKey) && e.keyCode === 13) || e.keyCode === 9)) {
                        e.stopPropagation();
                    }
                }}>
                {this.props.in_grid && <Button
                    style={{
                        position: "absolute",
                        right: "-10px",
                        top: "-4px",
                        border: "0px",
                        background: 'transparent',
                        color: 'black',
                    }}
                    onClick={(e) => {this.setState({new_window: true})}}
                    icon="pi pi-external-link"
                    tooltip="Open in Editor?"
                    label=""/>
                }
                <Editor
                    ref={(e) => this.editor = e}
                    style={{height: '100%'}}
                    value={this.state.value}
                    modules={{
                        mention: quillMention(this.controller.signal),
                    }}
                    onTextChange={this.onTextChange}/>
                <LinoEditor {...this.props} parent={this} visible={this.props.new_window || this.state.new_window} />
                </div>
                : <div style={{position: "relative", height: "100%", width: "100%"}}>
                    <span>{this.state.value}</span>
                    {this.props.in_grid && <span
                        onClick={(e) => e.stopPropagation()}
                        style={{position: "absolute", right: "-23px", top: "-16px"}}>
                        <Button
                            className="p-transparent-button"
                            style={{border: "0px", background: 'transparent', color: 'black'}}
                            onClick={(e) => {this.setState({new_window: true})}}
                            icon="pi pi-external-link"
                            tooltip="Open in Editor?"
                            label=""/>
                    </span>}
                    <LinoEditor {...this.props} parent={this} visible={this.props.new_window || this.state.new_window} />
                </div>

        if (this.props.in_grid) return elem;

        if (this.props.editing_mode) {
            elem = <Labeled
                {...this.props}
                elem={this.props.elem}
                labeled={this.props.labeled}
                isFilled={this.state.value}>
                {elem}
            </Labeled>
        } else {
            elem = <Panel
                headerTemplate={<div className="p-panel-header">
                        {this.props.elem.label}
                        {this.props.elem.name !== "full_preview" && <Button
                            className="p-transparent-button"
                            style={{
                                border: "0px",
                                background: 'transparent',
                                color: 'black',
                            }}
                            onClick={(e) => {
                                this.setState({new_window: true});
                            }}
                            icon="pi pi-external-link"
                            tooltip="Open in Editor?"
                            label=""/>}
                    </div>}
                style={{height: "90%", display: "flex", flexDirection: "column"}}>
                {elem}
            </Panel>
        }

        return elem
    }
}

export default TextFieldElement;
