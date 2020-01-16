const fse = require("fs-extra");
const htmlparser2 = require("htmlparser2");
const Path = require("path");
const puppeteer = require("puppeteer");

/**
 * 1、解析html 生成数据
 * 2、生成截图
 * 3、生成html， 插入index.html
 */
let currentCommentData;

const parser = new htmlparser2.Parser(
  {
    oncomment(data) {
      currentCommentData = commentToData(data);
    },
    onend(data) {
      console.log("end");
    }
  },
  { decodeEntities: true }
);
// 注释转数据
function commentToData(comment = "") {
  return comment
    .split("\n")
    .filter(line => /date|lang/g.test(line))
    .map(info => {
      const d = info.trim().split(":");
      return { [d[0]]: d[1].trim() };
    })
    .reduce((v, c, i) => (v = { ...v, ...c }), {});
}

// 解析Html
function parseHtml(filePath) {
  const fileBuffer = fse.readFileSync(filePath);
  parser.write(fileBuffer.toString());
}

// 生成截图
async function generateSrceenShot(browser, filename, file) {
  const page = await browser.newPage();
  await page.goto(`http://localhost:8888/page/${file}`);
  const dom = await page.$("[screenshot]");
  await dom.screenshot({ path: Path.resolve(`src/image/${filename}.png`) });
}

// 填充index模板
function replaceTemplate(penSet) {
  let penHtml = "";
  for (const pen of penSet) {
    penHtml += `
      <li>
        <section>
            <a href="./page/${pen.filename}.html">
                <img  src="./image/${pen.filename}.png" alt="">
            </a>
        </section>
        <div>
            <span class="name">${pen.filename}</span>
            <span class="date">${pen.date}</span>
        </div>
        <p>${pen.lang}</p>
      </li>`;
  }
  const templateStr = fse.readFileSync(Path.resolve('src/temp.html')).toString();
  const pens = templateStr.replace('{{li}}', penHtml);
  fse.writeFileSync(Path.resolve('src/index.html'), pens);
}

async function prePublish(cb) {
  const files = fse.readdirSync(Path.resolve("src/page"));
  const browser = await puppeteer.launch();
  const penSet = new Set();

  for (const file of files) {
    const filePath = Path.resolve(`src/page/${file}`);
    const filename = file.split(".")[0];
    parseHtml(filePath);
    await generateSrceenShot(browser, filename, file);
    penSet.add({ filename, ...currentCommentData });
  }

  replaceTemplate(penSet)
  await browser.close();
  cb();
}

module.exports = prePublish;
