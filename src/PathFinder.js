import React from 'react'
import Grid from './Grid'
import MenuBar from './MenuBar'
import {astar, bfs, dfs, dijkstra} from './Algorithm'
import './Grid.css'
import {gridIdx} from './GridDraw'
import Buffer from './Buffer'
import {mazeRecursiveDiv} from './MazeGenerator'

class PathFinder extends React.Component {
    constructor() {
        super()
        this.state = {
            visitedNodes:new Set(),
            pathToTarget:new Set(),
            wallNodes:new Set(),
            weakWallNodes:new Set(),
            buffer:new Buffer([],[]),
            sourceNode:{x:5, y:20},
            targetNode:{x:7, y:30},
            gridSize:{numRows:25, numCols:45},
            isUpdateSourceNodeMode:false,
            isUpdateTargetNodeMode:false,
            selectedAlgo:'',
            isDrawingMode:false,
            selectedWallType:'',
            isRunning:false
        }
        this.updateSourceNode = this.updateSourceNode.bind(this)
        this.setUpdateSourceNodeMode = this.setUpdateSourceNodeMode.bind(this)
        this.updateTargetNode = this.updateTargetNode.bind(this)
        this.setUpdateTargetNodeMode = this.setUpdateTargetNodeMode.bind(this)
        this.setAlgo = this.setAlgo.bind(this)
        this.bufferAlgo = this.bufferAlgo.bind(this)
        this.reset = this.reset.bind(this)
        this.setDrawingMode = this.setDrawingMode.bind(this)
        this.updateDrawnNodes = this.updateDrawnNodes.bind(this)
        this.setWallType = this.setWallType.bind(this)
        this.playback = this.playback.bind(this)
        this.pausePlayback = this.pausePlayback.bind(this)
        this.start = this.start.bind(this)
        this.clearVisuals = this.clearVisuals.bind(this)
        this.generateMaze = this.generateMaze.bind(this)
    }

    updateSourceNode(sourceNode) {
        this.setState({sourceNode:sourceNode, isUpdateSourceNodeMode:false})
    }

    updateTargetNode(targetNode) {
        this.setState({targetNode:targetNode, isUpdateTargetNodeMode:false})
    }

    setUpdateSourceNodeMode() {
        if (this.state.buffer.isEmpty())
            this.setState({isUpdateSourceNodeMode:true})
    }

    setUpdateTargetNodeMode() {
        if (this.state.buffer.isEmpty())
            this.setState({isUpdateTargetNodeMode:true})
    }

    setAlgo(algo) {
        if (this.state.isRunning) return
        this.setState({selectedAlgo:algo, visitedNodes:new Set(), pathToTarget:new Set(), buffer: new Buffer([], [])})
    }

    bufferAlgo() {
        let buffer = null
        switch(this.state.selectedAlgo) {
            case 'BFS':
                buffer = bfs(this.state.sourceNode, this.state.targetNode, this.state.gridSize, this.state.wallNodes)
                break
            case 'DFS':
                buffer = dfs(this.state.sourceNode, this.state.targetNode, this.state.gridSize, this.state.wallNodes)
                break
            case 'DIJKSTRA':
                buffer = dijkstra(this.state.sourceNode, this.state.targetNode, this.state.gridSize, this.state.wallNodes, this.state.weakWallNodes)
                break
            case 'ASTAR':
                buffer = astar(this.state.sourceNode, this.state.targetNode, this.state.gridSize, this.state.wallNodes, this.state.weakWallNodes)
                break
            default:
                return
        }
        buffer.update(this.state.visitedNodes.size)
        this.setState({buffer:buffer})
    }

    async start() {
        if (this.state.buffer.isEmpty()) {
            await(new Promise((resolve) => {
                this.clearVisuals()
                resolve()
            }))
        }
        await(new Promise((resolve) => {
            this.bufferAlgo()
            resolve()
        }))
        this.playback()
    }

    playback() {
        const createPromise = (visitedNodes, pathToTarget) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    this.setState({visitedNodes:visitedNodes, pathToTarget:pathToTarget})
                    resolve();
                }, 10)
            })
        }
        this.setState({isRunning:true}, async ()=> {
            while (this.state.isRunning) {
                if (this.state.buffer.visitedIsEmpty() && this.state.buffer.pathIsEmpty()) {
                    this.setState({isRunning:false})
                    break
                }
                let visitedNodes = new Set(this.state.visitedNodes)
                let pathToTarget = new Set(this.state.pathToTarget)
                if (!this.state.buffer.visitedIsEmpty()) {
                    visitedNodes.add(this.state.buffer.consumeVisited())
                } else {
                    pathToTarget.add(this.state.buffer.consumePath())
                }
                await(createPromise(visitedNodes, pathToTarget))
            }
        })
    }

    pausePlayback() {
        this.setState({isRunning:false})
    }

    setDrawingMode(isDrawingMode) {
        this.setState({isDrawingMode:isDrawingMode})
    }

    updateDrawnNodes(nodeIndex) {
        if (this.state.isRunning) return;
        let updatedWallNodes = this.state.selectedWallType === 'UNPASSABLE' ? new Set(this.state.wallNodes) : new Set(this.state.weakWallNodes)
        updatedWallNodes.add(gridIdx(nodeIndex, this.state.gridSize.numCols))
        let updatedState = this.state.selectedWallType === 'UNPASSABLE' ? {wallNodes:updatedWallNodes} : {weakWallNodes:updatedWallNodes}
        this.setState(updatedState)
    }

    reset() {
        this.setState({visitedNodes:new Set(), pathToTarget:new Set(), wallNodes:new Set(), weakWallNodes:new Set(), buffer:new Buffer([], [])})
    }

    clearVisuals() {
        this.setState({visitedNodes:new Set(), pathToTarget:new Set(), buffer:new Buffer([], [])})
    }

    setWallType(wallType) {
        this.setState({selectedWallType:wallType})
    }

    async generateMaze() {
        const createPromise = (wallNodes) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    this.setState({wallNodes:wallNodes})
                    resolve();
                }, 10)
            })
        }
        const res = mazeRecursiveDiv(this.state.gridSize, this.state.sourceNode, this.state.targetNode)
        const wallNodes = new Set()
        for (let wallNode of res) {
            wallNodes.add(wallNode)
            await(createPromise(wallNodes))
        }
    }

    render() {
        const nodeModifier = {
            setUpdateSourceNodeMode:this.setUpdateSourceNodeMode,
            setUpdateTargetNodeMode:this.setUpdateTargetNodeMode,
            updateSourceNode:this.updateSourceNode,
            updateTargetNode:this.updateTargetNode,
            isUpdateSourceNodeMode:this.state.isUpdateSourceNodeMode,
            isUpdateTargetNodeMode:this.state.isUpdateTargetNodeMode,
            setDrawingMode:this.setDrawingMode,
            isDrawingMode:this.state.isDrawingMode,
            updateDrawnNodes:this.updateDrawnNodes
        }
        return (
            <div>
                <MenuBar genMaze={this.generateMaze} setAlgo={this.setAlgo} start={this.start} pause={this.pausePlayback} reset={this.reset} clearVisuals={this.clearVisuals} setWallType={this.setWallType} isRunning={this.state.isRunning}/>
                <div className='table_container'> <Grid gridState={this.state} nodeModifier={nodeModifier}/> </div>
            </div>
        )
    }
}

export default PathFinder