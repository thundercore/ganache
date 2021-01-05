import connect from "../../../../renderer/screens/helpers/connect";

import TransactionLink from "../components/TransactionLink";
import React, { Component } from "react";
import TransactionData from "../transaction-data";
import { CancellationToken } from "./utils";

class Transactions extends Component {
  refresher = new CancellationToken();

  componentDidMount(){
    this.refresh();
  }

  componentWillUnmount() {
    this.refresher.cancel();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.config.updated !== this.props.config.updated || prevState.selectedNode !== this.state.selectedNode) {
      this.refresh();
    }
  }

  async refresh() {
    this.refresher.cancel();

    let canceller = this.refresher.getCanceller();
    
    const workspace = this.props.config.settings.workspace;
    const nodes = workspace.nodes;    
    const filteredNodes = this.state.selectedNode !== "" ? nodes.filter(node => node.safeName === this.state.selectedNode) : nodes;
    const transactions = await TransactionData.getAllTransactions(filteredNodes, nodes, workspace.postgresPort, canceller);
    if (canceller.cancelled) return;
    this.setState({transactions});
  }

  constructor(props) {
    super(props);

    const state = {
      selectedNode: "",
      transactions: null
    };
    this.props.config.settings.workspace.nodes.forEach((node) => {
      state["node_" + node.safeName] = {};
    });
    this.state = state;
  }

  getNodeRows() {
    return this.state.transactions.sort((a, b) => b.earliestRecordedTime - a.earliestRecordedTime).map(tx => {
      return (<TransactionLink key={tx.txhash} tx={tx} />);
    })
  }

  render() {
    const workspace = this.props.config.settings.workspace;
    let txs;
    if (this.state.transactions === null) {
      txs = (<div className="Waiting Waiting-Padded">Loading Transactions...</div>);
    } else if (this.state.transactions.length === 0) {
      txs = (<div className="Waiting Waiting-Padded">No Transactions</div>);
    } else {
      txs = this.getNodeRows();
    }
    return (
      <div className="corda-transactions">
        <div className="corda-transactions-filter">
          <div className="corda-transactions-label">Filter</div>
          <div className="StyledSelect">
            <select defaultValue={this.state.selectedNode} onChange={(e) => {this.setState({"selectedNode": e.target.value})}}>
              <option value="">All nodes</option>
              {workspace.nodes.map((node) => {
                return <option key={node.safeName} value={node.safeName}>{node.name}</option>
              })}
            </select>
          </div>
        </div>
        <div className="corda-transactions-list Nodes DataRows">
          <main> {txs} </main>
        </div>
      </div>
    );
  }
}

export default connect(
  Transactions,
  "config"
);
