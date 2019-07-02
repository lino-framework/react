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
import {SiteContext} from "./SiteContext";
import LinoLayout from "./LinoComponents";
import LinoBbar from "./LinoBbar";
import DomHandler from "../../../../primereact/src/components/utils/DomHandler";

// better onOpen focusing logic.
Dialog.prototype.focus = function focus() {
        let focusable;
        [this.contentElement, this.footerElement, this.headerElement].filter(e=>e).some(elem => {
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
        content: PropTypes.any, // Content for Yes/no dialogs
    };
    static defaultProps = {
        data: {},
        closable: true,
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
        this.setState({visible: false});
        this.props.onClose(this);

    };

    render() {

        return <SiteContext.Consumer>{(siteData) => {
            const footer = this.props.footer || <div><LinoBbar rp={this} actorData={siteData.actors[this.props.actorId]}
                                                               an={this.props.action.an} sr={[undefined]}/></div>
            // webpack wants theres decerations here, not in the if, otherwise unassigned var error in return

            return <Dialog onHide={this.onClose} visible={this.state.visible}
                           header={this.props.title || this.props.action.label}
                           footer={footer}
                           maximizable={true}
                           onShow={()=> this.ll && this.ll.focusFirst()}
                           closable={this.props.closable}>
                {this.props.content
                ||
                <LinoLayout data={this.props.data}
                            actorId={this.props.actorId}
                            actorData={siteData.actors[this.props.actorId]}
                            action={this.props.action}
                            update_value={(v) => this.props.update_value(v, this._reactInternalFiber.key)}
                            editing_mode={true}
                            match={this.props.router}
                            onSubmit={this.props.onOk}
                            window_layout={this.props.action.window_layout}
                            ref={el=>this.ll=el}
                            />}
            </Dialog>
        }}</SiteContext.Consumer>

    };
}
