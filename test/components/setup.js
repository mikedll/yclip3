require('ignore-styles')

require('jsdom-global')()

const configure = require('enzyme').configure
const Adapter = require('enzyme-adapter-react-16');
configure({ adapter: new Adapter() });

