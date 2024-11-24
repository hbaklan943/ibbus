import { XMLParser } from "fast-xml-parser";
import { NextResponse } from "next/server";

const apiLineListUrl =
  "https://api.ibb.gov.tr/iett/UlasimAnaVeri/HatDurakGuzergah.asmx?wsdl";

export type Line = {
  HAT_UZUNLUGU: number;
  SEFER_SURESI: number;
  SHATADI: string;
  SHATKODU: string;
  TARIFE: string;
};

export type LineList = Line[];
export async function POST(req: Request) {
  try {
    /* const { searchParams } = new URL(req.url);
    const hatKodu = searchParams.get("hatKodu");

    if (!hatKodu) {
      return NextResponse.json(
        { error: "hatKodu parameter is required" },
        { status: 400 }
      );
    } */

    const soapRequestBody = `
      <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <GetHat_json xmlns="http://tempuri.org/">
            <HatKodu></HatKodu>
          </GetHat_json>
        </soap:Body>
      </soap:Envelope>
    `;

    const response = await fetch(apiLineListUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "http://tempuri.org/GetHat_json",
      },
      body: soapRequestBody,
    });

    //console.log("Response:", response);

    if (!response.ok) {
      console.error(`response not ok: ${response.statusText}`);
      return NextResponse.json(
        { error: `response not ok: ${response.statusText}` },
        { status: response.status }
      );
    }

    const text = await response.text();
    console.log("SOAP Response:", text);

    if (text.includes("<html>")) {
      console.error("Received an HTML error page instead of SOAP response");
      return NextResponse.json(
        { error: "Received an HTML error page instead of SOAP response" },
        { status: 500 }
      );
    }

    const parser = new XMLParser({
      ignoreAttributes: false, // Don't ignore attributes
      parseTagValue: true, // Parse values inside tags
      parseNodeValue: true, // Parse text content
    } as { [key: string]: boolean });

    const parsedXml = parser.parse(text);
    console.log("Parsed XML:", parsedXml["soap:Envelope"]["soap:Body"]);

    const jsonResult =
      parsedXml["soap:Envelope"]["soap:Body"]["GetHat_jsonResponse"][
        "GetHat_jsonResult"
      ];

    if (jsonResult) {
      const jsonData = JSON.parse(jsonResult);
      return NextResponse.json(jsonData);
    } else {
      console.error("No JSON data found in the SOAP response.");
      return NextResponse.json(
        { error: "No JSON data found in response" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error occurred while processing the request:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
