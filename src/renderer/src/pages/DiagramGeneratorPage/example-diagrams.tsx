export const exampleDiagrams = {
  aws: `<?xml version="1.0" encoding="UTF-8"?>
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
</mxfile>`,
  'software-architecture': `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="embed.diagrams.net" agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) bedrock-engineer/1.15.1 Chrome/136.0.7103.115 Electron/36.3.2 Safari/537.36" version="27.1.6">
  <diagram name="ページ1" id="x">
    <mxGraphModel dx="892" dy="602" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="x-1" value="Users" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;" parent="1" vertex="1">
          <mxGeometry x="100" y="100" width="120" height="40" as="geometry" />
        </mxCell>
        <mxCell id="x-2" value="user_id (PK)&#xa;username&#xa;email&#xa;password&#xa;first_name&#xa;last_name&#xa;phone&#xa;address&#xa;created_at" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#f8f9fa;strokeColor=#6c8ebf;align=left;verticalAlign=top;" parent="1" vertex="1">
          <mxGeometry x="100" y="140" width="120" height="140" as="geometry" />
        </mxCell>
        <mxCell id="x-3" value="Products" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;" parent="1" vertex="1">
          <mxGeometry x="400" y="100" width="120" height="40" as="geometry" />
        </mxCell>
        <mxCell id="x-4" value="product_id (PK)&#xa;name&#xa;description&#xa;price&#xa;stock_quantity&#xa;category&#xa;brand&#xa;image_url&#xa;created_at&#xa;updated_at" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#f8f9fa;strokeColor=#82b366;align=left;verticalAlign=top;" parent="1" vertex="1">
          <mxGeometry x="400" y="140" width="120" height="160" as="geometry" />
        </mxCell>
        <mxCell id="x-5" value="Orders" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontStyle=1;" parent="1" vertex="1">
          <mxGeometry x="100" y="400" width="120" height="40" as="geometry" />
        </mxCell>
        <mxCell id="x-6" value="order_id (PK)&#xa;user_id (FK)&#xa;order_date&#xa;total_amount&#xa;status&#xa;shipping_address&#xa;payment_method&#xa;created_at&#xa;updated_at" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#f8f9fa;strokeColor=#d6b656;align=left;verticalAlign=top;" parent="1" vertex="1">
          <mxGeometry x="100" y="440" width="120" height="140" as="geometry" />
        </mxCell>
        <mxCell id="x-7" value="Order_Items" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontStyle=1;" parent="1" vertex="1">
          <mxGeometry x="400" y="400" width="120" height="40" as="geometry" />
        </mxCell>
        <mxCell id="x-8" value="order_item_id (PK)&#xa;order_id (FK)&#xa;product_id (FK)&#xa;quantity&#xa;unit_price&#xa;subtotal" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#f8f9fa;strokeColor=#b85450;align=left;verticalAlign=top;" parent="1" vertex="1">
          <mxGeometry x="400" y="460" width="120" height="100" as="geometry" />
        </mxCell>
        <mxCell id="x-9" value="1" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;" parent="1" vertex="1">
          <mxGeometry x="160" y="290" width="20" height="20" as="geometry" />
        </mxCell>
        <mxCell id="x-10" value="M" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;" parent="1" vertex="1">
          <mxGeometry x="160" y="370" width="20" height="20" as="geometry" />
        </mxCell>
        <mxCell id="x-11" value="1" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;" parent="1" vertex="1">
          <mxGeometry x="230" y="490" width="20" height="20" as="geometry" />
        </mxCell>
        <mxCell id="x-12" value="M" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;" parent="1" vertex="1">
          <mxGeometry x="370" y="490" width="20" height="20" as="geometry" />
        </mxCell>
        <mxCell id="x-13" value="1" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;" parent="1" vertex="1">
          <mxGeometry x="460" y="310" width="20" height="20" as="geometry" />
        </mxCell>
        <mxCell id="x-14" value="M" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;" parent="1" vertex="1">
          <mxGeometry x="460" y="370" width="20" height="20" as="geometry" />
        </mxCell>
        <mxCell id="x-15" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=none;endFill=0;" parent="1" source="x-2" target="x-6" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="x-16" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=none;endFill=0;" parent="1" source="x-6" target="x-8" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="x-17" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=none;endFill=0;" parent="1" source="x-4" target="x-8" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="x-18" value="places" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;rotation=-90;" parent="1" vertex="1">
          <mxGeometry x="70" y="330" width="40" height="20" as="geometry" />
        </mxCell>
        <mxCell id="x-19" value="contains" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;" parent="1" vertex="1">
          <mxGeometry x="270" y="470" width="50" height="20" as="geometry" />
        </mxCell>
        <mxCell id="x-20" value="includes" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;rotation=-90;" parent="1" vertex="1">
          <mxGeometry x="530" y="340" width="40" height="20" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`,
  'business-process': `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="embed.diagrams.net" agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) bedrock-engineer/1.15.1 Chrome/136.0.7103.115 Electron/36.3.2 Safari/537.36" version="27.1.6">
  <diagram name="Page1" id="x">
    <mxGraphModel dx="892" dy="602" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="x-1" value="Customer Inquiry Received" style="ellipse;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" parent="1" vertex="1">
          <mxGeometry x="340" y="40" width="120" height="60" as="geometry" />
        </mxCell>
        <mxCell id="x-2" value="Gather Issue Details" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" parent="1" vertex="1">
          <mxGeometry x="340" y="140" width="120" height="60" as="geometry" />
        </mxCell>
        <mxCell id="x-3" value="High Priority Issue?" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" parent="1" vertex="1">
          <mxGeometry x="350" y="240" width="100" height="80" as="geometry" />
        </mxCell>
        <mxCell id="x-4" value="Immediate Escalation" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;" parent="1" vertex="1">
          <mxGeometry x="540" y="250" width="120" height="60" as="geometry" />
        </mxCell>
        <mxCell id="x-5" value="Solvable with FAQ/Knowledge Base?" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" parent="1" vertex="1">
          <mxGeometry x="330" y="360" width="140" height="100" as="geometry" />
        </mxCell>
        <mxCell id="x-6" value="Provide Standard Solution" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" parent="1" vertex="1">
          <mxGeometry x="540" y="380" width="120" height="60" as="geometry" />
        </mxCell>
        <mxCell id="x-7" value="Technical Issue?" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" parent="1" vertex="1">
          <mxGeometry x="350" y="500" width="100" height="80" as="geometry" />
        </mxCell>
        <mxCell id="x-8" value="Transfer to Technical Team" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;" parent="1" vertex="1">
          <mxGeometry x="540" y="510" width="120" height="60" as="geometry" />
        </mxCell>
        <mxCell id="x-9" value="Billing/Account Related?" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" parent="1" vertex="1">
          <mxGeometry x="330" y="620" width="140" height="80" as="geometry" />
        </mxCell>
        <mxCell id="x-10" value="Transfer to Billing Team" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;" parent="1" vertex="1">
          <mxGeometry x="540" y="630" width="120" height="60" as="geometry" />
        </mxCell>
        <mxCell id="x-11" value="Handle with General Support" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" parent="1" vertex="1">
          <mxGeometry x="340" y="740" width="120" height="60" as="geometry" />
        </mxCell>
        <mxCell id="x-12" value="Issue Resolved?" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" parent="1" vertex="1">
          <mxGeometry x="350" y="840" width="100" height="80" as="geometry" />
        </mxCell>
        <mxCell id="x-13" value="Conduct Follow-up" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" parent="1" vertex="1">
          <mxGeometry x="340" y="960" width="120" height="60" as="geometry" />
        </mxCell>
        <mxCell id="x-14" value="Escalate to Senior Support" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;" parent="1" vertex="1">
          <mxGeometry x="540" y="850" width="120" height="60" as="geometry" />
        </mxCell>
        <mxCell id="x-15" value="Close Case" style="ellipse;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" parent="1" vertex="1">
          <mxGeometry x="360" y="1060" width="80" height="40" as="geometry" />
        </mxCell>
        <mxCell id="x-16" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" parent="1" source="x-1" target="x-2" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="x-17" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" parent="1" source="x-2" target="x-3" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="x-18" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" parent="1" source="x-3" target="x-4" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="x-19" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" parent="1" source="x-3" target="x-5" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="x-20" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" parent="1" source="x-5" target="x-6" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="x-21" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" parent="1" source="x-5" target="x-7" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="x-22" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" parent="1" source="x-7" target="x-8" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="x-23" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" parent="1" source="x-7" target="x-9" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="x-24" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" parent="1" source="x-9" target="x-10" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="x-25" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" parent="1" source="x-9" target="x-11" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="x-26" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" parent="1" source="x-11" target="x-12" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="x-27" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" parent="1" source="x-12" target="x-13" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="x-28" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" parent="1" source="x-12" target="x-14" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="x-29" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" parent="1" source="x-13" target="x-15" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="x-30" value="Yes" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];autosize=1;strokeColor=none;fillColor=none;" parent="1" vertex="1">
          <mxGeometry x="470" y="260" width="40" height="30" as="geometry" />
        </mxCell>
        <mxCell id="x-31" value="No" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];autosize=1;strokeColor=none;fillColor=none;" parent="1" vertex="1">
          <mxGeometry x="400" y="320" width="30" height="30" as="geometry" />
        </mxCell>
        <mxCell id="x-32" value="Yes" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];autosize=1;strokeColor=none;fillColor=none;" parent="1" vertex="1">
          <mxGeometry x="480" y="390" width="40" height="30" as="geometry" />
        </mxCell>
        <mxCell id="x-33" value="No" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];autosize=1;strokeColor=none;fillColor=none;" parent="1" vertex="1">
          <mxGeometry x="400" y="470" width="30" height="30" as="geometry" />
        </mxCell>
        <mxCell id="x-34" value="Yes" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];autosize=1;strokeColor=none;fillColor=none;" parent="1" vertex="1">
          <mxGeometry x="470" y="520" width="40" height="30" as="geometry" />
        </mxCell>
        <mxCell id="x-35" value="No" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];autosize=1;strokeColor=none;fillColor=none;" parent="1" vertex="1">
          <mxGeometry x="400" y="590" width="30" height="30" as="geometry" />
        </mxCell>
        <mxCell id="x-36" value="Yes" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];autosize=1;strokeColor=none;fillColor=none;" parent="1" vertex="1">
          <mxGeometry x="480" y="640" width="40" height="30" as="geometry" />
        </mxCell>
        <mxCell id="x-37" value="No" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];autosize=1;strokeColor=none;fillColor=none;" parent="1" vertex="1">
          <mxGeometry x="400" y="710" width="30" height="30" as="geometry" />
        </mxCell>
        <mxCell id="x-38" value="Yes" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];autosize=1;strokeColor=none;fillColor=none;" parent="1" vertex="1">
          <mxGeometry x="400" y="930" width="40" height="30" as="geometry" />
        </mxCell>
        <mxCell id="x-39" value="No" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];autosize=1;strokeColor=none;fillColor=none;" parent="1" vertex="1">
          <mxGeometry x="470" y="860" width="30" height="30" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`
}
