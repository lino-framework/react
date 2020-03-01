import React, {Component} from "react";
import PropTypes from "prop-types";
import {fetch as fetchPolyfill} from 'whatwg-fetch'
import key from "weak-key";
import queryString from "query-string"
import {Editor} from 'primereact/editor';

import {ScrollPanel} from 'primereact/scrollpanel';
import Suggester from "../Suggester";
import 'rc-collapse/assets/index.css';
import './Conversations.css';
import {mapReverse} from "../LinoUtils"


export class LinoChatter extends Component {

    editor = React.createRef();

    static propTypes = {
        sendChat: PropTypes.func,
        sendSeenAction: PropTypes.func,
        group_id: PropTypes.number,
        openedconversation: PropTypes.string
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
            conservation_name: "",
        };
        this.reload = this.reload.bind(this);
        this.componentDidMount = this.componentDidMount.bind(this);
        this.componentDidUpdate = this.componentDidUpdate.bind(this);

        this.handleChange = this.handleChange.bind(this);
        this.keyPress = this.keyPress.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.consume_server_response = this.consume_server_response.bind(this);
        this.consume_WS_message = this.consume_WS_message.bind(this);

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
            an: "loadGroupChat",
            // limit: 10,
            // count: 10,
        };
        window.App.add_su(query);
        fetchPolyfill(`/api/chat/ChatGroup/` + `${this.props.group_id || "-99998"}` + `?${queryString.stringify(query)}`).then(
            window.App.handleAjaxResponse
        ).then(this.consume_server_response
        ).catch(/*error => window.App.handleAjaxException(error)*/);
    }

    consume_server_response(data) {
        let chats_data = data.rows[0];
        console.log('chats_data', chats_data)
        // this.input.current.focus();
        this.setState({
            chats: chats_data.messages,
            conservation_name: chats_data.name,
            NotSeenChats: chats_data.messages.filter(msg => msg[3] !== undefined).map(msg => msg[4]),
            scroll: new Date() + ""
        })
        console.log('state', this.state)
    }

    componentDidMount() {
        // Don't want to reload when mounted, as then we run the fetch command w/o the user activly intereacting to get messages.
        this.reload()
        // this.scrollToBottom()
    }

    componentDidUpdate(p, s) {
        if (this.state.scroll !== s.scroll) {
            setTimeout(() => (this.scrollToBottom()), 100)
        }

    }
    consume_WS_message(chat){
        console.log("got WS chat message", this, chat);
        this.setState(old => {
            return {
                chats: [chat].concat(old.chats),
                scroll: new Date() + ""
            }
        })
    }
    scrollToBottom = () => {
        this.chatBottom && this.chatBottom.scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'start'})
        // this.input.current.scrollIntoView({behavior: 'smooth'})
    }

    handleChange(e) {
        let {props} = this,
            value = e.htmlValue || "";
        this.setState({new_message: value})
    }

    handleFocus() {
        //let chatids = this.state.chats.map(msg => msg[4])
        // console.log('handleFocus',this.state.NotSeenChats)
        this.props.sendSeenAction(this.state.NotSeenChats)
        this.state.NotSeenChats = []
    }

    keyPress(e) {
        if (e.keyCode === 13 && e.target.innerText) {
            this.props.sendChat({'body': e.target.innerText, 'group_id': this.props.group_id});
            this.setState((old) => ({})
            );
            e.target.innerText = "";
            // this.reload() // todo, don't reload. Just add new chat message, and confirm that it's delivered when you get onRecived back from WS
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

    render_chat_message(userName, userID, currentUserID, sentDateTime, chatHTML, chatPK) {
        let selfChat = currentUserID === userID;
        return <div key={chatPK}>
            <div style={{
                display: "flex",
                direction: (selfChat? "rtl" : "ltr")
            }}>
                <span className={"user"}>{userName}</span>
            </div>
            <div className={"message-wrapper"}
                 style={{
                     display: "flex",
                     flexDirection: selfChat ? "row-reverse" : "row",
                     [selfChat ? "marginLeft" : "marginRright"]: "1em",
                 }}>
                <div title={sentDateTime}
                     style={{background: selfChat ? "#07bdf4" : "#06b4f1"}}
                     className={"message"}
                     dangerouslySetInnerHTML={{__html: chatHTML || "\u00a0"}}/>
            </div>
        </div>
    }

    render() {
        let actorID = "tickets/Tickets";
        return <div className="scrollable sidebar">
            <div className="chatwindow">
                <ScrollPanel className={"chatwindow-chats"} style={{height: "302px"}}>
                    {this.state.chats && mapReverse(this.state.chats,(chat) => {

                        // (cp.user.username, ar.parse_memo(cp.chat.body), cp.created, cp.seen, cp.chat.pk, cp.chat.user.id))
                        let userName = chat[0],
                            userID = chat[5],
                            currentUserID = window.App.state.user_settings.user_id,
                            chatHTML = chat[1],
                            sentDateTime = chat[2],
                            chatPK = chat[4];

                        return this.render_chat_message(userName, userID, currentUserID,sentDateTime, chatHTML, chatPK)})}
                    <div ref={(el) => this.chatBottom = el} style={{height: "1ch"}}/>
                </ScrollPanel>
                <Suggester getElement={() => this.editor}
                           attachTo={() => this.editor && this.editor.editorElement}
                           actorId={actorID}
                           triggerKeys={window.App.state.site_data ? window.App.state.site_data.suggestors : ''}
                           field="Field" // TODO @Hamza, this shold be the field_name of the model. IE:"body"
                           id='ID' // TODO @Hamza, this should be the ID/PK for the row
                           componentDidUpdate={(state) => {
                               if (state.triggered && state.suggestions.length && state.startPoint <= state.cursor.selectionStart && !state.text.includes("\n")) {
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
                        <Editor style={{height: '100%', width: "281.7px"}}
                                headerTemplate={this.header}
                                placeholder={"Write to group..."}
                                ref={e => this.editor = e}
                                onTextChange={this.handleChange}/>
                    </div>
                </Suggester>
            </div>
        </div>
    }
};