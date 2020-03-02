import React, {Component} from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";

import {ScrollPanel} from 'primereact/scrollpanel';

import './Messenger.css';
import './ConversationList.css';
import './ConversationListItem.css';

export class GroupChatChooser extends Component {

    static propTypes = {
        attachTo: PropTypes.element,
        groups: PropTypes.array,
        OpenConversation: PropTypes.func
    };

    static defaultProps = {
        groups: []
    };

    constructor() {
        super();
        this.render_conversation_list_item = this.render_conversation_list_item.bind(this);
        this.render_conversation_list = this.render_conversation_list.bind(this);
    };

    render_conversation_list_item(title, unseen_count) {
        return (
            <div className="conversation-list-item">
                <div className="conversation-info">
                    <h1 className="conversation-title">{title}</h1>
                    <span>{unseen_count}</span>
                </div>
            </div>
        );
    };

    render_conversation_list(groups, onClick) {
        return (
            <div className="conversation-list">
                {groups.map(group => <div
                        onClick={(e) => {onClick(group, e)}}
                    >
                        {this.render_conversation_list_item(group.title, group.unseen)}
                    </div>
                )}
            </div>
        );
    };

    render() {
        if (this.props.attachTo) {
            return ReactDOM.createPortal(<div className="messenger">
                    <ScrollPanel className={"chatwindow-chats"} style={{height: "302px"}}>
                        {this.render_conversation_list(this.props.groups, (group) => this.props.OpenConversation(group.id))}
                    </ScrollPanel>
                </div>
                , this.props.attachTo)
        }
    };
};