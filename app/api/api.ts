/* import { DOMParser } from "xmldom";

type Announcement = {
  HATKODU: string;
  HAT: string;
  TIP: string;
  GUNCELLEME_SAATI: string;
  MESAJ: string;
};

type VehiclePosition = {
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

const hatNo = "15BK";

const apiAnnouncementUrl =
  "https://api.ibb.gov.tr/iett/UlasimDinamikVeri/Duyurular.asmx";
const apiVehiclePositionUrl =
  "https://api.ibb.gov.tr/iett/FiloDurum/SeferGerceklesme.asmx";

async function getLineVehiclePosition() {
  try {
    const response = await fetch(apiVehiclePositionUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "http://tempuri.org/GetHatOtoKonum_json",
      },
      body: `
                <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                    <soap:Body>
                        <GetHatOtoKonum_json xmlns="http://tempuri.org/"> <HatKodu>${hatNo}</HatKodu> </GetHatOtoKonum_json>
                    </soap:Body>
                </soap:Envelope>
            `,
    });

    const text = await response.text();
    //console.log("SOAP Response:", text);

    // Parse the SOAP response
    const doc = new DOMParser().parseFromString(text, "text/html");

    const jsonResult = doc?.querySelector(
      "GetHatOtoKonum_jsonResult"
    )?.textContent;
    if (jsonResult) {
      const jsonData: [VehiclePosition] = JSON.parse(jsonResult);
      console.log("Parsed JSON:", jsonData);
      return jsonData;
    } else {
      console.error("No JSON data found in response.");
    }
  } catch (error) {
    console.error("Error fetching line vehicle position:", error);
  }
}

async function getAnnouncementsJSON() {
  try {
    const response = await fetch(apiAnnouncementUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "http://tempuri.org/GetDuyurular_json",
      },
      body: `
                <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                    <soap:Body>
                        <GetDuyurular_json xmlns="http://tempuri.org/" />
                    </soap:Body>
                </soap:Envelope>
            `,
    });

    const text = await response.text();
    //console.log("SOAP Response:", text);

    // Parse the SOAP response
    const doc = new DOMParser().parseFromString(text, "text/html");

    const jsonResult = doc?.querySelector(
      "GetDuyurular_jsonResult"
    )?.textContent;
    if (jsonResult) {
      const jsonData: [Announcement] = JSON.parse(jsonResult);
      //console.log("Parsed JSON:", jsonData);
      console.log(
        jsonData.filter((announcement) => announcement.HATKODU == hatNo)
      );
    } else {
      console.error("No JSON data found in response.");
    }
  } catch (error) {
    console.error("Error fetching announcements in JSON format:", error);
  }
}

export { getLineVehiclePosition, getAnnouncementsJSON };

export type { VehiclePosition, Announcement };
 */

// This file isn't being used, but it's a good example of how to fetch data from a SOAP API and parse the response.
// not neccecery for this project
