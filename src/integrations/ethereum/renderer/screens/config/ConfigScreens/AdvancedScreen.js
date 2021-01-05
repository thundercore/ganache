import React, { Component } from "react";

import GoogleAnalytics from "../../../../../../renderer/components/google-analytics/GoogleAnalytics"

import OnlyIf from "../../../../../../renderer/components/only-if/OnlyIf";
import FilePicker from "../../../../../../renderer/components/file-picker/FilePicker";

const VALIDATIONS = {
  "workspace.logDirectory": {
    canBeBlank: false,
    allowedChars: /^(?!.*Select a Directory).+$/,
  },
};

class AdvancedScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      logDirectory: props.config.settings.workspace.logDirectory,
    };
  }

  toggleOutputToLogs = e => {
    if (this.state.logDirectory == null) {
      // this setting was turned off, turn it on
      // eslint-disable-next-line react/no-direct-mutation-state
      this.state.logDirectory = "Select a Directory";
    } else {
      // this setting was turned on and set, turn it off by setting to null
      // eslint-disable-next-line react/no-direct-mutation-state
      this.state.logDirectory = null;
    }

    this.validateChange(e);
  };

  changeLogDirectory = (value, e) => {
    // eslint-disable-next-line react/no-direct-mutation-state
    this.state.logDirectory = value;

    this.validateChange(e);
  };

  validateChange = e => {
    if (e.target.name === "workspace.logDirectory") {
      // the value to validate isn't the value of the HTML element
      e = {
        target: {
          name: "workspace.logDirectory",
          value: this.state.logDirectory,
        },
      };
    }

    let tempValidations = JSON.parse(JSON.stringify(VALIDATIONS));

    if (
      this.state.logDirectory === null &&
      "workspace.logDirectory" in tempValidations
    ) {
      // if the switch is off for logging to file, then don't validate
      tempValidations.logDirectory = null;
    }

    this.props.validateChange(e, VALIDATIONS);
  };

  render() {
    const server = this.props.config.settings.workspace.server || {};
    return (
      <div>
        <h2>LOGGING</h2>
        <section>
          <h4>OUTPUT LOGS TO FILE</h4>
          <div className="Row">
            <div className="RowItem">
              <div className="Switch">
                <input
                  type="checkbox"
                  name="workspace.logDirectory"
                  id="OutputToLogs"
                  checked={this.state.logDirectory != null}
                  onChange={this.toggleOutputToLogs}
                />
                <label htmlFor="OutputToLogs">OUTPUT LOGS TO FILE</label>
              </div>
            </div>
            <div className="RowItem">
              <p>Save logs to file.</p>
            </div>
          </div>
        </section>
        <OnlyIf test={this.state.logDirectory != null}>
          <section>
            <h4>LOG FILE DIRECTORY</h4>
            <div className="Row">
              <div className="RowItem">
                <FilePicker
                  id="Logdirectory"
                  name="workspace.logDirectory"
                  defaultValue="Select a Directory"
                  buttonValue="Pick a Folder"
                  directoriesOnly={true}
                  value={this.state.logDirectory}
                  onChangeFunction={(value, e) =>
                    this.changeLogDirectory(value, e)
                  }
                />
                {this.props.validationErrors["logDirectory"] && (
                  <p className="ValidationError">
                    Must select a directory or disable &quot;Output Logs To File&quot;
                  </p>
                )}
              </div>
              <div className="RowItem">
                <p>
                  Path to a directory to save the timestamped log files. A
                  separate file will be generated everytime you restart Ganache.
                  It is recommended to create a directory just for these logs.
                </p>
              </div>
            </div>
          </section>
        </OnlyIf>
        <section>
          <h4>VERBOSE LOGS</h4>
          <div className="Row">
            <div className="RowItem">
              <div className="Switch">
                <input
                  type="checkbox"
                  name="workspace.server.verbose"
                  id="Verbose"
                  onChange={this.props.handleInputChange}
                  checked={server.verbose}
                />
                <label htmlFor="Verbose">Verbose Logs</label>
              </div>
            </div>
            <div className="RowItem">
              <p>Increase the log output.</p>
            </div>
          </div>
        </section>
        <GoogleAnalytics googleAnalyticsTracking={this.props.config.settings.global.googleAnalyticsTracking} handleInputChange={this.props.handleInputChange} />
        {/* <section>
          <h4>CPU &amp; MEMORY PROFILING</h4>
          <div className="Row">
            <div className="RowItem">
              <div className="Switch">
                <input
                  type="checkbox"
                  name="cpuAndMemoryProfiling"
                  id="CpuAndMemoryProfiling"
                  onChange={this.props.handleInputChange}
                  checked={this.props.formState.cpuAndMemoryProfiling}
                />
                <label htmlFor="CpuAndMemoryProfiling">
                  CPU &amp; MEMORY PROFILING
                </label>
              </div>
            </div>
            <div className="RowItem">
              <p>
                Strictly for debugging Ganache. Dumps detailed metrics to a log
                file. Only enable if you are asked to by Truffle support.
              </p>
            </div>
          </div>
        </section> */}
      </div>
    );
  }
}

export default AdvancedScreen;
