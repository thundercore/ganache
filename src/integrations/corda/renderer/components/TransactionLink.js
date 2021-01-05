import { Link } from "react-router-dom";
import React, { Component } from "react";
import connect from "../../../../renderer/screens/helpers/connect";

class TransactionLink extends Component {
  /**
   * Mutates the objects in the `states` array. Sue me. :-p
   * @param {*} states 
   * @param {*} statesMetaData 
   */
  static joinAndSort(states, statesMetadata) {
    states = (states || []).map((transaction, i) => {
      transaction._metaData = statesMetadata[i];
      transaction._recordedTime = new Date(transaction._metaData.recordedTime);
      return transaction;
    });
    return states.sort(TransactionLink.sort);
  }
  static sort(a, b) {
    const timeDiff = b._recordedTime - a._recordedTime
    if (timeDiff !== 0) {
      return timeDiff;
    } else {
      if (b.ref.txhash === a.ref.txhash) {
        return b.ref.index - a.ref.index;
      } else if (b.ref.txhash < a.ref.txhash) {
        return 1;
      } else {
        return -1;
      }
    }
  }
  getWorkspaceNode(owningKey) {
    return this.props.config.settings.workspace.nodes.find(node => owningKey === node.owningKey);
  }
  render() {
    const tx = this.props.tx;
    const observers = [];
    for (let observer of tx.observers){
      observers.push(<div key={observer.safeName}>{observer.name}</div>);
    }
    return (
      <Link to={`/corda/transactions/${tx.txhash}`} className="DataRow corda-transaction-link">
        <div className="corda-link-left">
          <div className="RowItem RowItemTopAligned corda-transaction-hash">
            <div className="Label">Transaction Id</div>
            <div className="Value">{tx.txhash}</div>
          </div>
          <div className="RowItem RowItemTopAligned">
            <div className="Label">In Vault Of</div>
            <div className="Value">
              {observers}
            </div>
          </div>
        </div>
        <div className="RowItem corda-link-right corda-transaction-link-badge">
          {tx.notaries.size > 0 ? (<div className="TransactionTypeBadge ContractCallBadge">Notarized</div>) : ""}
        </div>
      </Link>
    );
  }
}

export default connect(
  TransactionLink,
  "config",
);