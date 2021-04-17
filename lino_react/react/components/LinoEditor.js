import React from 'react';

import AbortController from 'abort-controller';

import {Button} from 'primereact/button';
import {Dialog} from 'primereact/dialog';
import {Editor} from 'primereact/editor';

import {getValue, getDataKey} from './LinoComponents';
import {quillMention} from "./quillmodules";


export class LinoEditor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            unsaved: false,
            value: getValue(props),
        }
        this.controller = new AbortController();
        this.onTextChange = this.onTextChange.bind(this);
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
    }

    render () {
        return <div onClick={(e) => e.stopPropagation()}>
            <Dialog
                header={this.props.elem.label}
                icons={<Button
                        className="p-transparent-button"
                        style={{
                            border: "0px",
                            background: 'transparent',
                            color: 'black',
                        }}
                        onClick={(e) => {
                            this.props.update_value({[getDataKey(this.props)]: this.state.value},
                                this.props.elem,
                                this.props.column);
                            if (this.props.in_grid) {
                                this.props.column.onEditorSubmit({columnProps: this.props.column}, true);
                            } else {
                                this.props.save();
                            }
                        }}
                        icon="pi pi-save"
                        tooltip="Save!"
                        label=""/>}
                maximizable={true}
                onHide={(e) => {
                    this.props.parent.setState({new_window: false});
                    if (this.props.in_grid) this.props.refresh();
                }}
                style={{width: "70vw", height: "85vw"}}
                contentStyle={{height: "100%"}}
                visible={this.props.visible}>
                <Editor
                    modules={{
                        mention: quillMention(this.controller.signal),
                    }}
                    onTextChange={this.onTextChange}
                    value={this.state.value}/>
            </Dialog>
        </div>
    }
}
