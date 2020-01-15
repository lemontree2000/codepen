const fse = require("fs-extra");
const htmlparser2 = require("htmlparser2");
const Path = require("path");
const puppeteer = require("puppeteer-core")
/**
 * 1、解析html 生成数据
 * 2、生成截图
 * 3、生成html， 插入index.html
 */


const parser = new htmlparser2.Parser(
  {
    oncomment(data) {
      console.log(data)
    },
    onend(data) {
      console.log("end");
    }
  },
  { decodeEntities: true }
);

function prePublish(cb) {
  const files = fse.readdirSync(Path.resolve("src/page"));
  files.map(file => {
    const filePath = Path.resolve(`src/page/${file}`);
    const fileBuffer = fse.readFileSync(filePath);
    parser.write(fileBuffer.toString());
  });


  (async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://baidu.com');
    await page.screenshot({path: 'example.png'});
  
    await browser.close();
  })();

  cb();
}

module.exports = prePublish;
