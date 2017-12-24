exports.LSBroadcastState = function LSBroadcastState() {
  this.neighbours.forEach(neighbour => {
    this.sendTo(neighbour.port, {
      protocol: 'ls',
      origin: this.port,
      neighbours: this.neighbours
    });
  });
}

exports.LSUpdateRouteTable = function LSUpdateRouteTable(packet) {
  this.adjacencyList.get(packet.origin).neighbours = packet.neighbours;
  this.runDijkstra();
}

exports.runDijkstra = function runDijkstra() {
  // 初始化current_dist
  const current_dist = new Map();
  this.adjacencyList.forEach((neighbours, port) => {
    current_dist.set(port, {
      port: port,
      cost: Number.MAX_SAFE_INTEGER,
      hasExpanded: false,
      nextHop: -1 // 下一跳的路由
    });
  });
  const originDistInfo = current_dist.get(this.port);
  originDistInfo.cost = 0;
  originDistInfo.nextHop = this.port;

  // 不断扩展节点，更新current_dist
  for (let i = 0; i < this.adjacencyList.size; i++) {
    // 找到下一个要扩展的节点（也就是尚未扩展，但是距离原点距离最短的那个节点）
    let expandingRouter = -1,
      minCost = -1;
    current_dist.forEach((distInfo, port) => {
      if (distInfo.cost < minCost && !distInfo.hasExpanded) {
        expandingRouter = port;
        minCost = distInfo.cost;
      }
    });
    if (expandingRouter == -1 || minCost == -1) throw new Error('没有找到可扩展的节点');

    // 扩展expandingRouter
    const expandingDistInfo = current_dist.get(expandingRouter);
    expandingDistInfo.hasExpanded = true;

    const neighbours = this.adjacencyList.get(expandingRouter);
    neighbours.forEach((neighbour) => {
      const neighbourDistInfo = current_dist.get(neighbour.port);
      if (neighbourDistInfo.cost > expandingDistInfo.cost + neighbour.cost) {
        // neighbour与原点的距离 > expandingRouter与原点的距离 + expandingRouter与neighbour的距离
        neighbourDistInfo.cost = expandingDistInfo.cost + neighbour.cost;
        neighbourDistInfo.nextHop = expandingRouter.nextHop;
      }
    });
  }

  // 使用current_dist更新路由表
  // TODO: 哪些路由表项的timestamp需要更新
  current_dist.forEach((distInfo, port) => {
    let originalRouteItem = this.routeTable.get(port);
    if (originalRouteItem === undefined ||
      originalRouteItem.cost !== distInfo.cost ||
      originalRouteItem.toPort !== distInfo.nextHop) {
        // 如果路由表还没有去往该目标路由器的条目，或条目的cost与计算结果不同，或条目的nextHop与计算结果不同
        // 更新该表项
      this.routeTable.set(port, {
        dest: port,
        cost: distInfo.cost,
        toPort: distInfo.nextHop,
        timestamp: new Date()
      });
    }
  });

}