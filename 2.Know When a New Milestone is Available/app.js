// Axios is a promise-based HTTP client for the browser and node.js. 
import axios from "axios";

// Express is a JavaSscript web application framework. 
import express from "express";

// Instantiate an express application 
let app = express();

// Use a json handler for incoming HTTP requests.
app.use(express.json());

// Application constructor 
export default class App {
  constructor(accessToken, callbackUrl) {
    this.host = "https://developer-stg.api.autodesk.com/";
    //this.graphAPI = `${this.host}forge/v2`;
    this.graphAPI = `${this.host}manufacturing/graphql/v1`;
    this.accessToken = accessToken;
    this.port = 3000;
    this.callbackUrl = callbackUrl;
  }

  getRequestHeaders() {
    return {
      "Content-type": "application/json",
      "Authorization": "Bearer " + this.accessToken,
    };
  }

  async sendQuery(query, variables) {
    return await axios({
      method: 'POST',
      url: `${this.graphAPI}`,
      headers: this.getRequestHeaders(),
      data: { 
        query,
        variables
      }
    })
  }

  async subscribeToEvent(hubName, projectName, fileName, eventType, callbackURL) {
    try {
      let rootComponentId = await this.getRootComponentId(hubName, projectName, fileName);

      let response = await this.sendQuery(
        `mutation CreateWebhook($componentId: ID!, $eventType: WebhookEventTypeEnum!, $callbackURL: String!) {
          createWebhook(webhook: {
            componentId: $componentId,
            eventType: $eventType,
            callbackURL: $callbackURL,
            expiresOn: "2022-10-12T07:20:50.52Z",
            secretToken: "12345678901234567890123456789012"
          }) {
            id
          }
        }`,
        {
          componentId: rootComponentId,
          eventType,
          callbackURL
        }
      )

      let webhookId = response.data.data.createWebhook.id;

      console.log('Created hook ' + webhookId);

      return webhookId;
    } catch (err) {
      console.log("There was an issue: " + err.message)
    }
  }

  async unsubscribeToEvent(eventType) {
    try {
      let webhooks = await this.getWebhooks(eventType);

      for (let webhook of webhooks) {
        let response = await this.sendQuery(
          `mutation DeleteWebhook($webhookId: String!) {
            deleteWebhook(webhookId: $webhookId)
          }`,
          {
            webhookId: webhook.id
          }
        )

        console.log('Deleted hook ' + response.data.data.deleteWebhook);
      } 
    } catch (err) {
      console.log("There was an issue: " + err.message)
    }
  }

  async getRootComponentId(hubName, projectName, fileName) {
    let response = await this.sendQuery(
      `query GetRootComponent($hubName: String!, $projectName: String!, $fileName: String!) {
        hubs(filter:{name:$hubName}) {
          results {
            name
            projects(filter:{name:$projectName}) {
              results {
                name
                rootFolder {
                  items(filter:{name:$fileName}) {
                    results {
                      ... on DesignFile {
                        name
                        rootComponent {
                          id
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }`,
      {
        hubName,
        projectName,
        fileName
      }
    )

    let rootComponent = response.data.data
      .hubs.results[0]
      .projects.results[0]
      .rootFolder.items.results[0]
      .rootComponent;

    return rootComponent.id;
  }

  async getWebhooks(eventType) {
    let response = await this.sendQuery(
      `query {
        webhooks {
          results {
            id
            eventType
          }
        }
      }`
    )

    let webhooks = response.data.data
      .webhooks.results.filter(webhook => {
        return (
          webhook.eventType === eventType
        )
      });

    return webhooks;
  }

  async startMonitoringEvents() {
    try {
      console.log(
        `Listening to the events on http://localhost:${this.port} => ${this.callbackUrl}/callback`
      );
      app.post("/callback", async (req, res) => {
        console.log(
          `Received a notification with following content:\n ${JSON.stringify(
            req.body
          )}`
        );
      });
      app.listen(this.port);
    } catch (error) {
      console.log(error);
    }
  };
}
