import React, { Component } from "react";
import PropTypes from "prop-types";
// import shave from 'shave';

import './ConversationListItem.css';

export class ConversationListItem extends Component {
  static propTypes = {
    key: PropTypes.string,
    name: PropTypes.string,
  };

  render(){ 
    return (
      <div className="conversation-list-item">
        <div className="conversation-info" key={this.props.key}>
          <h1 className="conversation-title">{ this.props.name }</h1>
        </div>
      </div>
    );
  }
}