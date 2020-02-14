import React, { Component } from "react";
import PropTypes from "prop-types";
import { fetch as fetchPolyfill } from 'whatwg-fetch'
import key from "weak-key";
import queryString from "query-string"
import { Editor } from 'primereact/editor';

import { ScrollPanel } from 'primereact/scrollpanel';
import Suggester from "./Suggester";

export class LinoChatter extends Component {

    editor = React.createRef();

    static propTypes = {
        sendChat: PropTypes.func,
        sendSeenAction: PropTypes.func,
    };
    static defaultProps = {
        // open: false,
    };

    constructor() {
        super();
        this.state = {
            chatlog: [],
            new_message: '',
            chats: [],
            NotSeenChats: [],
        };
        this.reload = this.reload.bind(this);
        this.componentDidMount = this.componentDidMount.bind(this);
        this.componentDidUpdate = this.componentDidUpdate.bind(this);

        this.handleChange = this.handleChange.bind(this);
        this.keyPress = this.keyPress.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.consume_server_response = this.consume_server_response.bind(this);

        this.disableEnter = this.disableEnter.bind(this);
        this.enableEnter = this.enableEnter.bind(this);
        this.header = (<span></span>);
    }

    reload() {

        // todo pageing

        this.setState({
            loading: true,
        });
        let query = {
            fmt: "json",
            rp: key(this),
            // mt: this.props.actorData.content_type, // Should be the master actor's PK, so should be a prop / url param
            an: "getChats",
            limit: 10,
            count: 10,
        };
        window.App.add_su(query);
        fetchPolyfill(`/api/chat/ChatMessages/-99998` + `?${queryString.stringify(query)}`).then(
            window.App.handleAjaxResponse
        ).then(this.consume_server_response
        ).catch(/*error => window.App.handleAjaxException(error)*/);
    }

    consume_server_response(data) {
        let chats_data = data.rows;
        // console.log('chats_data',chats_data)
        // this.input.current.focus();
        this.setState({
            chats: chats_data,
            NotSeenChats: chats_data.filter(msg => msg[3] !== undefined).map(msg => msg[4]),
            scroll: new Date()+""
        })
    }

    componentDidMount() {
        // Don't want to reload when mounted, as then we run the fetch command w/o the user activly intereacting to get messages.
        // this.reload()
        // this.scrollToBottom()
    }

    componentDidUpdate(p, s) {
        if (this.state.scroll !== s.scroll) {
            setTimeout(() => (this.scrollToBottom()), 20)
        }

    }

    scrollToBottom = () => {
        this.chatBottom && this.chatBottom.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
        // this.input.current.scrollIntoView({behavior: 'smooth'})
    }

    handleChange(e) {
        let { props } = this,
            value = e.htmlValue || "";
        this.setState({ new_message: value })
    }

    handleFocus() {
        //let chatids = this.state.chats.map(msg => msg[4])
        // console.log('handleFocus',this.state.NotSeenChats)
        this.props.sendSeenAction(this.state.NotSeenChats)
        this.state.NotSeenChats = []
    }

    keyPress(e) {
        if (e.keyCode == 13 && e.target.innerText) {
            // console.log('new_message', e.target.value)
            this.props.sendChat(e.target.innerText);
            e.target.innerText = "";
            this.reload()
            // put the login here
        }
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
        let actorID = "tickets/Tickets";
        return <div className="chatwindow">
            <ScrollPanel className={"chatwindow-chats"} style={{ height: "302px" }}>
                {this.state.chats && this.state.chats.map((chat) => (
                    <div key={chat[4]}>
                        <div style={{
                            display: "flex",
                            direction: (window.App.state.user_settings.user_id === chat[5] ? "rtl" : "ltr")
                        }}>
                            <span className={"user"}>{chat[0]}</span>
                        </div>
                        <div className={"message-wrapper"}
                            style={{
                                display: "flex",
                                flexDirection: window.App.state.user_settings.user_id === chat[5] ? "row-reverse" : "row",
                                [window.App.state.user_settings.user_id === chat[5] ? "marginLeft" : "marginRright"] : "1em",
                            }}>
                            <div
                                style={{ background: window.App.state.user_settings.user_id === chat[5] ? "#07bdf4" : "#06b4f1" }}
                                className={"message"}>{chat[1]}</div>
                        </div>
                    </div>
                ))}
                <div ref={(el) => this.chatBottom = el} style={{ height: "1ch" }} />
            </ScrollPanel>
            <Suggester getElement={() => this.editor}
                attachTo={() => this.editor && this.editor.editorElement}
                actorId={actorID}
                triggerKeys={window.App.state.site_data ? window.App.state.site_data.suggestors : ''}
                field="Field"
                id='ID'
                componentDidUpdate={(state) => {
                    if (state.triggered && state.suggestions.length && state.startPoint <= state.cursor.selectionStart && !state.text.includes("\n")) {
                        this.disableEnter();
                    }
                    else {
                        this.enableEnter();
                    }
                }}
                optionSelected={({ state, props, selected }) => {
                    let text = /*state.triggeredKey + */selected[0] + " "; // if you add the trigger key use retain-1 and delete+1 to remove the existing triggerkey
                    this.editor.quill.updateContents([
                        { retain: state.startPoint },
                        { delete: state.text.length },//obj.cursor.selection - obj.cursor.startPoint},// 'World' is deleted
                        { insert: text }
                    ].filter(action => action[Object.keys(action)[0]])
                    );
                    this.editor.quill.setSelection(state.startPoint + text.length);
                    setTimeout(() => this.editor.quill.keyboard.bindings[13] = this.EnterHack, 10)
                }}
            >
                <div ref={(el) => {
                                    this.div = el
                                }}
                                onKeyDownCapture={(e) => {
                                    // console.log("onKeyPressCapture");
                                    if (e.key === "Enter") {
                                        // console.log("onKeyPressCapture ENTER");
                                        this.keyPress(e)
                                        e.preventDefault(); // Doesn't work!!
                                        e.stopPropagation(); // Doesn't work with quill!
                                    }
                                }}
                                >
                <Editor style={{height: '100%', width:"281.7px"}}
                    headerTemplate={this.header}
                    placeholder={"Write to group..."}
                    ref={e => this.editor = e}
                    onTextChange={this.handleChange} />
                </div>
            </Suggester>
        </div>
    }
};