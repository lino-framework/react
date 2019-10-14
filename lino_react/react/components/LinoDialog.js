import React, {Component} from "react";
import PropTypes from "prop-types";

// import {SiteContext} from "./SiteContext"
// import {Labeled} from "./LinoComponents"
//
// import {Button} from 'primereact/button';
// import {AutoComplete} from 'primereact/autocomplete';
// import queryString from "query-string";
// import {fetch as fetchPolyfill} from "whatwg-fetch";
import {Dialog} from 'primereact/dialog';
import {SiteContext, ActorContext} from "./SiteContext";
import LinoLayout from "./LinoComponents";
import LinoBbar from "./LinoBbar";
import DomHandler from "../../../../primereact/src/components/utils/DomHandler";

// better onOpen focusing logic.
Dialog.prototype.focus = function focus() {
    let focusable;
    [this.contentElement, this.footerElement, this.headerElement].filter(e => e).some(elem => {
        focusable = DomHandler.findSingle(elem, 'button,input,textarea');
        return focusable; // if true breaks loop
    });
    if (focusable) {
        focusable.focus();
    }
};

export class LinoDialog extends Component {

    static propTypes = {
        action: PropTypes.object, // action object from siteData
        onClose: PropTypes.func,   // Some sort of callback
        onOk: PropTypes.func,   // callback for submitting forms. Only for action panel form, not insert.
        // baseData: PropTypes.object,
        footer: PropTypes.element,
        actorId: PropTypes.string, // Full id, with . ie: tickets.Alltickets
        title: PropTypes.string,
        router: PropTypes.object, // router
        data: PropTypes.object,
        update_value: PropTypes.func,
        closable: PropTypes.bool,
        isClosable: PropTypes.func,
        content: PropTypes.any, // Content for Yes/no dialogs
        action_dialog: PropTypes.bool, // changes the API call for getting choices.
    };
    static defaultProps = {
        data: {},
        closable: true,
        action_dialog: false,
        isClosable: () => true,
    };

    constructor(props) {
        super();
        this.state = {
            visible: true,
            // data: Object.assign({}, props.data)
        };

        this.onClose = this.onClose.bind(this);
    };

    onClose() {
        if (this.props.isClosable(this)){ // can have side-effects ( Mainly a close confermation window )
            this.setState({visible: false});
            this.props.onClose(this);
        }

    };

    renderDialogStyle(ActorData){
        if (this.props.action === undefined) return {};
        const win_size = ActorData.ba[this.props.action.an].window_layout.window_size;

        let style = {
        };
        if (win_size && win_size[0]) // width
        {
            style.width = Math.floor((win_size[0] * 1.5 )) + "ch";
        }
        return style
    }
    renderDialogContentStyle(ActorData){
        if (this.props.action === undefined) return {};
        const win_size = ActorData.ba[this.props.action.an].window_layout.window_size;

        let style = {
        };
        if (win_size && win_size[1] && win_size[1] !== "auto"){
            style.height = win_size[1] * 3 + "ch";
            // style.margin_top = (win_size[1] / 2) * -1 + "ch";
        } // height
        return style
    }
    render() {

        return <ActorContext.Consumer>{(ActorData) => {
            const footer = this.props.footer || <div><LinoBbar rp={this} actorData={ActorData}
                                                               an={this.props.action.an} sr={[undefined]}/></div>;
            // webpack wants theres decerations here, not in the if, otherwise unassigned var error in return

            const stop = (event) => {
                event.stopPropagation();
                event.preventDefault();
            };


            return <div
                // Forward dragged files to fileUploader component.
                onDragEnter={(e) => {
                    stop(e);
                    this.ll.fileUpload.onDragEnter(e);
                }}
                onDragOver={(e) => {
                    stop(e);
                    this.ll.fileUpload.onDragOver(e);
                }}
                onDragLeave={(e) => {
                    stop(e);
                    this.ll.fileUpload.onDragLeave(e);
                }}
                onDrop={(e) => {
                    stop(e);
                    this.ll.fileUpload.onDrop(e);
                }}><Dialog onHide={this.onClose} visible={this.state.visible}
                           header={this.props.title || this.props.action.label}
                           footer={footer}
                           style={this.renderDialogStyle(ActorData)}
                           contentStyle={this.renderDialogContentStyle(ActorData)}
                           closeOnEscape={this.props.closeOnEscape}
                           maximizable={true}
                           onShow={() => this.ll && this.ll.focusFirst()}
                           ref={el => this.dialog = el}
                           closable={this.props.closable}>
                {this.props.content
                ||

                <LinoLayout data={this.props.data}
                            actorId={this.props.actorId}
                            actorData={ActorData}
                            action={this.props.action}
                            update_value={(v) => this.props.update_value(v, this._reactInternalFiber.key)}
                            editing_mode={true}
                            match={this.props.router}
                            onSubmit={this.props.onOk}
                            saveFileUploadRequest={(xhr_formData) => {
                                this.setState({
                                    FileUploadRequest: xhr_formData
                                })
                            }}
                            action_dialog={this.props.action_dialog}
                            window_layout={ActorData.ba[this.props.action.an].window_layout}
                            ref={el => this.ll = el}
                            inDialog={true}
                />
                }
            </Dialog></div>
        }}</ActorContext.Consumer>

    };
}
