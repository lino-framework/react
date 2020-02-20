import React, { Component } from "react";
import PropTypes from "prop-types";
import {ConversationList} from './ConversationList';
import './Messenger.css';

export class Messenger extends Component {

  static propTypes = {
    OpenConversation: PropTypes.func,
  };

  render()  {
    return (
        <div className="messenger">
          <div className="scrollable sidebar">
            <ConversationList 
              OpenConversation={this.props.OpenConversation}/>
          </div>

        </div>
      );
    }
}