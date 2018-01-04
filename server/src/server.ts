import * as WebSocket from 'ws';

import { Router } from './router';
import { RouterController } from './RouterController';
import {
  Command,
  ServerSend,
  ClientSend,
  NodeParam,
  LinkParam,
} from '../../types';

const wss = new WebSocket.Server({ port: 8999 });
const routerController = new RouterController();

wss.on('connection', (ws: WebSocket) => {
  console.log('have connection');
  routerController.clearRouters();
  // connection is up, let's add a simple simple event
  ws.on('message', (message: string) => {
    const receivedObject: ClientSend<any> = JSON.parse(message);
    console.log("接收到消息", receivedObject);
    let routerId: number;
    let routerId1: number;
    let routerId2: number;
    let linkCost: number;
    switch (receivedObject.command) {
      case Command.createRouter:
        routerId = routerController.createRouter();
        const res1: ServerSend<NodeParam> = {
          command: Command.createRouter,
          isSuccess: true,
          data: { routerId: routerId }
        };
        ws.send(JSON.stringify(res1));

        break;
      case Command.createLink:
        const param = (receivedObject as ClientSend<LinkParam>).parameters;
        if (routerController.createLink(param.routerId1, param.routerId2, param.linkCost)) {
          const res2: ServerSend<null> = { command: Command.createLink, isSuccess: true, data: null };
          ws.send(JSON.stringify(res2));
        }
        break;
      case Command.fetchNodeInfo:
        routerId = (receivedObject as ClientSend<NodeParam>).parameters.routerId;
        const routerInfo = routerController.getRouterInfo(routerId);
        const res3: ServerSend<any> = {
          command: Command.fetchNodeInfo,
          isSuccess: true,
          data: { ...routerInfo, routerId }
        };
        ws.send(JSON.stringify(res3));
        break;
      case Command.shutdownRouter:
        routerId = (receivedObject as ClientSend<NodeParam>).parameters.routerId;
        routerController.shutdownRouter(routerId);
        const res4: ServerSend<null> = { command: Command.shutdownRouter, isSuccess: true, data: null };
        ws.send(JSON.stringify(res4));
        break;
      case Command.changeLinkCost:
        ({ routerId1, routerId2, linkCost } = (receivedObject as ClientSend<LinkParam>).parameters);
        routerController.changeLinkCost(routerId1, routerId2, linkCost);
        const res5: ServerSend<null> = { command: Command.changeLinkCost, isSuccess: true, data: null };
        ws.send(JSON.stringify(res5));
        break;
      case Command.turnOnRouter:
        routerId = (receivedObject as ClientSend<NodeParam>).parameters.routerId;
        routerController.turnOnRouter(routerId);
        const res6: ServerSend<null> = { command: Command.turnOnRouter, isSuccess: true, data: null };
        ws.send(JSON.stringify(res6));
        break;
      case Command.deleteRouter:
        routerId = (receivedObject as ClientSend<NodeParam>).parameters.routerId;
        routerController.deleteRouter(routerId);
        const res7: ServerSend<NodeParam> = { command: Command.deleteRouter, isSuccess: true, data: { routerId } };
        ws.send(JSON.stringify(res7));
        break;
      case Command.deleteEdge:
        ({ routerId1, routerId2 } = (receivedObject as ClientSend<LinkParam>).parameters);
        routerController.deleteEdge(routerId1, routerId2);
        const res8: ServerSend<LinkParam> =
          { command: Command.deleteEdge, isSuccess: true, data: { routerId1, routerId2, linkCost: -1 } };
        ws.send(JSON.stringify(res8));
        break;
    }
  });

  ws.on("error", (err) => {
    console.error("连接中断", err);
  });

  ws.on("close", (code: number, reason: string) => {
    console.error("连接关闭", code, reason);
  });

  ws.on("open", () => {
    console.error("连接打开");
  });

});

console.log(`server is listening on port 8999`);
