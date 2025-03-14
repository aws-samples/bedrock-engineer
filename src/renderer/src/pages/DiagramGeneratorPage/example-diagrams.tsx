export const exampleDiagrams = {
  serverless: `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="embed.diagrams.net" agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) bedrock-engineer/1.1.2 Chrome/126.0.6478.61 Electron/31.0.2 Safari/537.36" version="26.0.16">
  <diagram name="Simple Serverless API Backend" id="simple-serverless-api">
    <mxGraphModel dx="1037" dy="959" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1100" pageHeight="850" background="#ffffff" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="2" value="Client" style="sketch=0;outlineConnect=0;fontColor=#232F3E;gradientColor=none;fillColor=#232F3E;strokeColor=none;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;pointerEvents=1;shape=mxgraph.aws4.user;" parent="1" vertex="1">
          <mxGeometry x="150" y="350" width="78" height="78" as="geometry" />
        </mxCell>
        <mxCell id="3" value="Amazon API Gateway" style="sketch=0;points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];outlineConnect=0;fontColor=#232F3E;gradientColor=#FF4F8B;gradientDirection=north;fillColor=#BC1356;strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.api_gateway;" parent="1" vertex="1">
          <mxGeometry x="350" y="350" width="78" height="78" as="geometry" />
        </mxCell>
        <mxCell id="4" value="AWS Lambda" style="sketch=0;points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];outlineConnect=0;fontColor=#232F3E;gradientColor=#F78E04;gradientDirection=north;fillColor=#D05C17;strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.lambda;" parent="1" vertex="1">
          <mxGeometry x="550" y="350" width="78" height="78" as="geometry" />
        </mxCell>
        <mxCell id="5" value="Amazon DynamoDB" style="sketch=0;points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];outlineConnect=0;fontColor=#232F3E;gradientColor=#4D72F3;gradientDirection=north;fillColor=#3334B9;strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.dynamodb;" parent="1" vertex="1">
          <mxGeometry x="750" y="350" width="78" height="78" as="geometry" />
        </mxCell>
        <mxCell id="6" value="AWS CloudWatch" style="sketch=0;points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];outlineConnect=0;fontColor=#232F3E;gradientColor=#F34482;gradientDirection=north;fillColor=#BC1356;strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.cloudwatch;" parent="1" vertex="1">
          <mxGeometry x="550" y="200" width="78" height="78" as="geometry" />
        </mxCell>
        <mxCell id="7" value="" style="edgeStyle=orthogonalEdgeStyle;html=1;endArrow=block;elbow=vertical;startArrow=none;endFill=1;strokeColor=#545B64;rounded=0;" parent="1" source="2" target="3" edge="1">
          <mxGeometry width="100" relative="1" as="geometry">
            <mxPoint x="240" y="389.5" as="sourcePoint" />
            <mxPoint x="340" y="389.5" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <mxCell id="8" value="HTTP Requests" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];" parent="7" vertex="1" connectable="0">
          <mxGeometry x="-0.2" y="1" relative="1" as="geometry">
            <mxPoint x="12" y="-9" as="offset" />
          </mxGeometry>
        </mxCell>
        <mxCell id="9" value="" style="edgeStyle=orthogonalEdgeStyle;html=1;endArrow=block;elbow=vertical;startArrow=none;endFill=1;strokeColor=#545B64;rounded=0;" parent="1" source="3" target="4" edge="1">
          <mxGeometry width="100" relative="1" as="geometry">
            <mxPoint x="440" y="389.5" as="sourcePoint" />
            <mxPoint x="540" y="389.5" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <mxCell id="10" value="Triggers" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];" parent="9" vertex="1" connectable="0">
          <mxGeometry x="-0.2" y="1" relative="1" as="geometry">
            <mxPoint x="12" y="-9" as="offset" />
          </mxGeometry>
        </mxCell>
        <mxCell id="11" value="" style="edgeStyle=orthogonalEdgeStyle;html=1;endArrow=block;elbow=vertical;startArrow=none;endFill=1;strokeColor=#545B64;rounded=0;" parent="1" source="4" target="5" edge="1">
          <mxGeometry width="100" relative="1" as="geometry">
            <mxPoint x="640" y="389.5" as="sourcePoint" />
            <mxPoint x="740" y="389.5" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <mxCell id="12" value="CRUD Operations" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];" parent="11" vertex="1" connectable="0">
          <mxGeometry x="-0.2" y="1" relative="1" as="geometry">
            <mxPoint x="12" y="-9" as="offset" />
          </mxGeometry>
        </mxCell>
        <mxCell id="13" value="" style="edgeStyle=orthogonalEdgeStyle;html=1;endArrow=block;elbow=vertical;startArrow=none;endFill=1;strokeColor=#545B64;rounded=0;" parent="1" source="4" target="6" edge="1">
          <mxGeometry width="100" relative="1" as="geometry">
            <mxPoint x="589" y="340" as="sourcePoint" />
            <mxPoint x="589" y="290" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <mxCell id="14" value="Logs &amp; Metrics" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];" parent="13" vertex="1" connectable="0">
          <mxGeometry x="-0.2" y="1" relative="1" as="geometry">
            <mxPoint y="-9" as="offset" />
          </mxGeometry>
        </mxCell>
        <mxCell id="15" value="AWS Cloud" style="points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_aws_cloud_alt;strokeColor=#232F3E;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#232F3E;dashed=0;" parent="1" vertex="1">
          <mxGeometry x="300" y="150" width="580" height="330" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`
}
