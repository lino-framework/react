import React, {Component} from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import {fetch as fetchPolyfill} from "whatwg-fetch";
import {GroupChatChooser} from "./GroupChatChooser";
import queryString from "query-string"


import Collapse from 'rc-collapse';
import {Panel} from 'rc-collapse';

import {LinoChatter} from './LinoChatter';
import 'rc-collapse/assets/index.css';
import './Conversations.css';

import {debounce} from "../LinoUtils";

export class LinoChats extends Component {

    static propTypes = {
        groupChatChooserMountPoint: PropTypes.element,
        chatsUnseenBadgeMountPoint: PropTypes.element,
        sendChat: PropTypes.func,
        sendSeenAction: PropTypes.func,
        OpenConversation: PropTypes.func,
        openedconversations: PropTypes.array,
        onGetGroups: PropTypes.func,
    };

    static defaultProps = {
        openedconversations: [],
        onGetGroups: () => {
        },
    };

    constructor() {
        super();
        this.state = {
            groups: [] // state of known groups and names etc [{id:2, title:Customers, unseen:3}...]
        };
        this.getChatGroups = this.getChatGroups.bind(this);
        this.getUnseenCount = this.getUnseenCount.bind(this);


        this.sendSeenAction = debounce(this.sendSeenAction.bind(this), 2000, true);
        this.sendSeenAction = debounce(this.sendSeenAction.bind(this), 2000, true);
    }

    // method() {return this.props.}

    getUnseenCount() {
        let unseen = 0;
        this.state.groups.forEach(g => {
            unseen += g.unseen;
        });
        return unseen
    }

    getChatGroups() {
        let query = {
            fmt: "json",
            //rp: key(this),
            // mt: this.props.actorData.content_type, // Should be the master actor's PK, so should be a prop / url param
            an: "getChatGroups",
            // limit: 10,
            // count: 10,
        };
        window.App.add_su(query);
        fetchPolyfill(`/api/chat/ChatGroups/-99998` + `?${queryString.stringify(query)}`).then(
            window.App.handleAjaxResponse).then(response => {
            this.setState({groups: response.rows})
            this.props.onGetGroups(response.rows);
        });
    }

    sendSeenAction(group_id) {

        this.setState(old => {
            let {groups} = old;
            groups[groups.findIndex(g => g.id === group_id)].unseen = 0 // find and update seen count to 0
            return {groups: groups.splice(0)}
        })
        this.props.sendSeenAction(group_id);
    }


    /**
     * Used to act on WS messages coming from outside or inside LinoChats.
     *
     */
    consume_WS_message(chat) {
        // pass the chat array to the linoChater with the right group ID
        // TODO add user created chats to grou
        // TODO do find here to update the chat with the new chat from WS.
        let group_id = chat[6],
            userID = chat[5],
            currentUserID = window.App.state.user_settings.user_id;

        if (userID !== currentUserID) {
            this.setState(old => {
                let {groups} = old;
                groups[groups.findIndex(g => g.id === group_id)].unseen += 1;// find and update seen count to 0
                return {groups: groups.splice(0)}
            })
        }

        window.App.rps["chat-" + group_id].consume_WS_message(chat)
    }

    pushCallback(chat) {
        //todo open and focus current chat window
    }

    componentDidMount() {
        this.getChatGroups();
    };

    render() {
        let unseen = this.getUnseenCount();
        console.log("this.props.groupChatChooserMountPoint", this.props.groupChatChooserMountPoint);
        return <React.Fragment>
            {this.props.groupChatChooserMountPoint &&
            <GroupChatChooser OpenConversation={this.props.OpenConversation} groups={this.state.groups}
                              attachTo={this.props.groupChatChooserMountPoint}/>}
            {unseen && this.props.chatsUnseenBadgeMountPoint && ReactDOM.createPortal(<span
                className="layout-topbar-badge">{unseen}</span>, this.props.chatsUnseenBadgeMountPoint)}

            {this.props.openedconversations.length && <Collapse accordion={false} className="conversation-panel-list">
                {this.props.openedconversations.map((group_id) => {
                    let group = this.state.groups.find(g => g.id === group_id);
                    return <Panel isActive={true}
                                  header={group.title + (group.unseen ? " : " + group.unseen : "")}
                                  prefixCls={'rc-collapse'}

                                  key={group_id}>
                        <LinoChatter
                            ref={(el) => window.App.setRpRef(el, "chat-" + group_id)}
                            //opened={opened} // timestamp for reloading
                            unseen={group.unseen}
                            groupTitle={group.title}
                            sendChat={this.props.sendChat}
                            sendSeenAction={this.sendSeenAction}
                            group_id={group_id}/>
                    </Panel>
                })}
            </Collapse>}
        </React.Fragment>
    }
};
