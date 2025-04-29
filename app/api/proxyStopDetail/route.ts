//TODO: Add config file
// import { apiStopDetailUrl } from "../../config";

import { XMLParser } from "fast-xml-parser";
import { NextResponse } from "next/server";

const apiStopDetailUrl = "https://api.ibb.gov.tr/iett/ibb/ibb.asmx";

export type StopDetail = {
  HATKODU: string;
  YON: string;
  SIRANO: number;
  DURAKKODU: number;
  DURAKADI: string;
  XKOORDINATI: number;
  YKOORDINATI: number;
  DURAKTIPI: string;
  ISLETMEBOLGE: string;
  ISLETMEALTBOLGE: string;
  ILCEADI: string;
};

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const hatNo = searchParams.get("hatNo");

    if (!hatNo) {
      return NextResponse.json(
        { error: "hatNo parameter is required" },
        { status: 400 }
      );
    }

    const soapRequestBody = `
          <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
            <soapenv:Header/>
            <soapenv:Body>
                <tem:DurakDetay_GYY_wYonAdi>
                  <!--Optional:-->
                  <tem:hat_kodu>${hatNo}</tem:hat_kodu>
                </tem:DurakDetay_GYY_wYonAdi>
            </soapenv:Body>
          </soapenv:Envelope>
        `;
    const response = await fetch(apiStopDetailUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "http://tempuri.org/DurakDetay_GYY_wYonAdi",
      },
      body: soapRequestBody,
    });

    //`SOAP Response: <?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><soap:Body><DurakDetay_GYYResponse xmlns="http://tempuri.org/"><DurakDetay_GYYResult><NewDataSet xmlns=""><Table><HATKODU>15BK</HATKODU><YON>D</YON><SIRANO>1</SIRANO><DURAKKODU>403031</DURAKKODU><DURAKADI>KADIKÖY</DURAKADI><XKOORDINATI>29.024177</XKOORDINATI><YKOORDINATI>40.992825</YKOORDINATI><DURAKTIPI>CCMODERN</DURAKTIPI><ISLETMEBOLGE>Anadolu2</ISLETMEBOLGE><ISLETMEALTBOLGE>Kadıköy</ISLETMEALTBOLGE><ILCEADI>Kadiköy</ILCEADI></Table>`;

    const text = await response.text();

    const parser = new XMLParser({
      ignoreAttributes: false, // Don't ignore attributes
      parseTagValue: true, // Parse values inside tags
      parseNodeValue: true, // Parse text content
    } as { [key: string]: boolean });

    const parsedXml = parser.parse(text);
    //console.log("parsedxml: ", parsedXml);
    /* `
        parsedxml:  {
      "?xml": { "@_version": "1.0", "@_encoding": "utf-8" },
      "soap:Envelope": {
        "soap:Body": {
          DurakDetay_GYYResponse: {
            DurakDetay_GYYResult: { NewDataSet: [Object] },
            "@_xmlns": "http://tempuri.org/"
          }
        },
        "@_xmlns:soap": "http://schemas.xmlsoap.org/soap/envelope/",
        "@_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "@_xmlns:xsd": "http://www.w3.org/2001/XMLSchema"
      }
    }
        `; */

    const jsonResult =
      parsedXml["soap:Envelope"]["soap:Body"]["DurakDetay_GYY_wYonAdiResponse"][
        "DurakDetay_GYY_wYonAdiResult"
      ]["NewDataSet"]["Table"];

    //console.log("json result: ", jsonResult[0]);

    if (jsonResult) {
      //const jsonData = JSON.parse(jsonResult);
      return NextResponse.json(jsonResult as StopDetail[]);
    } else {
      console.error("No JSON data found in response.");
      return NextResponse.json(
        { error: "No JSON data found in response." },
        { status: 500 }
      );
    }

    // Parse the SOAP response
  } catch (error) {
    console.error("Error fetching stop detail:", error);
  }
}
