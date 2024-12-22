// main.ts written by 市川宏規, 2024. some rights reserved under MIT license.
import * as pdfjslib from "pdfjs-dist";
import {ShiftPage} from './page_parser.js';
import * as iCK from './icalendar_kitamura.js';

declare var pdfjslibWorkerSrc: string;
pdfjslib.GlobalWorkerOptions.workerSrc = pdfjslibWorkerSrc as string;
const defaultTarget = new URLSearchParams(window.location.search).get('id');

function addSortedText(to: string[], id?:string) : ShiftPage {
    let sp = new ShiftPage(id);
    to.forEach(one=>{
        sp.write(one);
    });
    return sp;
}

// 左上から横書き前提で並べる。
function textSorter(a: any, b:any): number {
    const lineHeight = 10; // 1行の大体の高さ。この値が小さすぎると、公休、半休あたりの行がずれる。
    if ('transform' in a && 'transform' in b) {
        if (Math.abs(a.transform[5] - b.transform[5]) < lineHeight) {
            return a.transform[4] - b.transform[4];
        } else {
            return b.transform[5] - a.transform[5];
        }
    } else {
        return 0;
    }
}

function extractText(pdfUrl: string, id?:string) : Promise<ShiftPage[]>{
    return pdfjslib.getDocument(pdfUrl).promise.then(pdf => {
        let promises = [] as Promise<ShiftPage>[];
        for (let i = 0; i < pdf.numPages; i++) {
            promises.push(pdf.getPage(i+1).then(page=>{
                return page.getTextContent().then(tc => {
                    return addSortedText(tc.items.sort(textSorter).map(a=>'str' in a ? a.str:''), id);
                });
            }));
        }
        return Promise.all(promises).then(pages=>pages);
    });
}

function updateSelector(page:ShiftPage) {
    let sel = document.querySelector("#members")! as HTMLSelectElement;
    sel.innerHTML = '';
    page.enumAllMemberIds().forEach(id=>{
        let opt = document.createElement('option');
        opt.setAttribute('value', id);
        if (defaultTarget && defaultTarget == id) {
            opt.setAttribute('selected', 'selected');
        }
        let text = document.createTextNode(id);
        opt.appendChild(text);
        sel.appendChild(opt);
    });
    if (page.targetMonth !== undefined) {
        document.querySelector('#targetMonth')!.innerHTML = `${page.targetMonth.getFullYear()}年${page.targetMonth.getMonth()+1}月分`;
    }
}

function activateDownloadButton(pages:ShiftPage[]) {
    let btn = document.querySelector('#doDownload')! as HTMLInputElement;
    btn.removeAttribute('disabled');
    btn.onclick = ()=>{
        let id = (document.querySelector("#members") as HTMLSelectElement).value;
        let cal = iCK.newCalendar();
        pages.forEach(page=>page.addTo(cal, id));
        let blob = new File([cal.toString()], 'test.ics', {type: 'text/calendar'});
        window.location.href = URL.createObjectURL(blob)!;
    };
}

window.addEventListener("load", (e) => {
    const targetfile = document.querySelector("#target-file")! as HTMLInputElement;
    targetfile.addEventListener("change", function(e){
        let url = URL.createObjectURL(this.files![0])!;
        extractText(url).then((pages:ShiftPage[])=>{
            updateSelector(pages[0]);
            activateDownloadButton(pages);
        });
    });
});