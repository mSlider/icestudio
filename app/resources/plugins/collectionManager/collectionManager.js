/*----------------------------------------------------------------------------- 
-- Collection manager plugin
-----------------------------------------------------------------------------*/

importScripts(
    '/node_modules/mustache/mustache.min.js',
    '/resources/libs/Icestudio/Crypto/SHA-256.js',
    '/resources/libs/icetemplatesystem.js',
    '/resources/libs/iceeventbus.js',
    '/resources/libs/Icestudio/GUI/Widgets/IceGuiTree.js',
    '/resources/libs/Icestudio/Plugin/IcePluginGUI.js',
    '/resources/libs/Icestudio/Plugin/IcePluginHelper.js',
    '/resources/libs/Icestudio/Plugin/IcePluginEventBus.js');

let gui = new IcePluginGUI();
let ebus = new IcePluginEventBus();
let tpl = new IceTemplateSystem();
let plugin = new IcePluginHelper();
let pConfig = false;
let state = 0;


function init(args) {

    pConfig = args;
    state = 0;
    let initialHtml = '<i class="close-panel" data-guievt="click" data-handler="closePanel"></i><div class="playground"><div class="lds-grid"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div><div class="cm-loader--status" >Indexing Database</div></div>';
    let stls = (pConfig.uiTheme === 'dark') ? 'assets/css/dark/dark.css' : 'assets/css/light/light.css';

    plugin.styleSheet([stls])
        .then(css => {
            gui.publish('createRootNode', { id: pConfig.id, initialContent: initialHtml, stylesheet: css, node: args.manifest.gui });
            ebus.publish('menu.collection', { id: pConfig.id, status: 'disable' });
        });
}

function updateTheme(args) {

    pConfig.uiTheme = args.uiTheme;
    init(pConfig);
}

function guiUpdate(args) {
    switch (state) {
        case 0:
            state = 1;
            gui.addWidget('blockTree', IceGuiTree);
            gui.components.blockTree.setId(pConfig.id);
            let tmp = pConfig.env.defaultCollection;
            tmp.name = 'Default collection';

            ebus.publish('plugin.cached', { key: 'collectionManager.vtree' });
            gui.components.blockTree.collectionsToTree(
                [tmp]
                    .concat(pConfig.env.externalCollections)
                    .concat(pConfig.env.internalCollections),
                { id: pConfig.id, el: '.cm-loader--status', content: 'Indexing collections' });

            gui.components.blockTree.afterIndexingDB(function (data) {
                ebus.publish('plugin.cache', { key: 'collectionManager.vtree', data: data });
                gui.components.blockTree.render({ id: pConfig.id, el: '.playground' });
            });
            break;
    }
}

function closePlugin() {

    ebus.publish('plugin.terminate', { id: pConfig.id });
    ebus.publish('menu.collection', { id: pConfig.id, status: 'enable' });
    self.close();
}

function treeViewToggleFolder(args) {
    gui.components.blockTree.toggle({ id: pConfig.id }, args.id);
}

function treeViewGetBlock(args) {
    gui.components.blockTree.getBlock({ id: pConfig.id }, args);
}

function preloadTree(data) {
    gui.components.blockTree.render({ id: pConfig.id, el: '.playground', vtree: data.cache });
}

function refresh(env) {
    
            pConfig.env=env;    
            let tmp = pConfig.env.defaultCollection;
            tmp.name = 'Default collection';

            gui.components.blockTree.collectionsToTree(
                [tmp]
                    .concat(pConfig.env.externalCollections)
                    .concat(pConfig.env.internalCollections),
                { id: pConfig.id, el: '.cm-loader--status', content: 'Indexing collections' });

            gui.components.blockTree.afterIndexingDB(function (data) {
                ebus.publish('plugin.cache', { key: 'collectionManager.vtree', data: data });
                gui.components.blockTree.render({ id: pConfig.id, el: '.playground' });
            });
 
}

ebus.subscribe('ui.updateTheme', updateTheme);
ebus.subscribe('plugin.initialSetup', init);
ebus.subscribe('cached.collectionManager.vtree', preloadTree);
ebus.subscribe('config.update', refresh);
gui.subscribe('gui.update', guiUpdate);
gui.subscribe('gui.click.closePanel', closePlugin);
gui.subscribe('gui.click.treeView.toggleFolder', treeViewToggleFolder);
gui.subscribe('gui.click.treeView.getBlock', treeViewGetBlock);



