import React, { Component } from "react";
import PropTypes from "prop-types";
import {ConversationListItem} from './ConversationListItem';
import { fetch as fetchPolyfill } from 'whatwg-fetch'
import queryString from "query-string";

import './ConversationList.css';

export class ConversationList extends Component {
  static propTypes = {
    OpenConversation: PropTypes.func,
  };
  constructor() {
    super();
    this.state = {
      conversations: [],
  };
    this.onOpenConversation = this.onOpenConversation.bind(this);
    this.getConversations = this.getConversations.bind(this);
  }

  componentDidMount() {
    this.getConversations()
  }

 getConversations(){
      let query = {
        fmt: "json",
        //rp: key(this),
        // mt: this.props.actorData.content_type, // Should be the master actor's PK, so should be a prop / url param
        an: "getGroupChats",
        limit: 10,
        count: 10,
    };
    window.App.add_su(query);
    fetchPolyfill(`/api/chat/ChatGroup/-99998` + `?${queryString.stringify(query)}`).then(
      window.App.handleAjaxResponse).then(response => {
        this.setState({'conversations':response.rows})
        });
  }

  onOpenConversation(conversation_id){
    this.props.OpenConversation(conversation_id);
  }

  render() {
    return (
      <div className="conversation-list">
        {
          this.state.conversations.map(conversation =>
            <div
                onClick={() => {
                  this.onOpenConversation(conversation.id)
              }}
              >
              <ConversationListItem
                key={conversation.id} 
                name={conversation.name}
              />
            </div>
          )
        }
      </div>
    );
      }
}