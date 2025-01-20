import { XMLParser } from "fast-xml-parser";
import { NextResponse } from "next/server";

export type VehiclePosition = {
  kapino: string;
  boylam: string;
  enlem: string;
  hatkodu: string;
  guzergahkodu: string;
  hatad: string;
  yon: string;
  son_konum_zamani: string;
  yakinDurakKodu: string;
};

const apiVehiclePositionUrl =
  "https://api.ibb.gov.tr/iett/FiloDurum/SeferGerceklesme.asmx";

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
      <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <GetHatOtoKonum_json xmlns="http://tempuri.org/">
            <HatKodu>${hatNo}</HatKodu>
          </GetHatOtoKonum_json>
        </soap:Body>
      </soap:Envelope>
    `;

    const response = await fetch(apiVehiclePositionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "http://tempuri.org/GetHatOtoKonum_json",
      },
      body: soapRequestBody,
    });

    if (!response.ok) {
      console.error(`response not ok: ${response.statusText}`);
      return NextResponse.json(
        { error: `response not ok: ${response.statusText}` },
        { status: response.status }
      );
    }

    const text = await response.text();
    //console.log("SOAP Response:", text);

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

    //console.log("Parsed XML:", parsedXml["soap:Envelope"]["soap:Body"]);

    const jsonResult =
      parsedXml["soap:Envelope"]["soap:Body"]["GetHatOtoKonum_jsonResponse"][
        "GetHatOtoKonum_jsonResult"
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
